import { OpenAI } from "langchain/llms/openai";
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    const model = new OpenAI({ temperature: 0 }, {openAIApiKey: process.env.OPENAI_API_KEY});
    const { userQuestion } = req.body;
    console.log(`User question is ${userQuestion}`);
    const prompt = `You are an AI model that translates natural language queries about the ten and two year United States government treasury bond yields into MongoDB queries. Given a question, you will provide the corresponding MongoDB query. Do not include anything in your response other than the mongodb query itself.
    Do not include the words "MongoDB Query" in your response. If the user asks about anything other than questions in relation to the 10 or 2 year treasury bonds, say "I don't know".

    Examples:

    Question: How many times has the 2 year treasury yield been above the 10 year treasury yield? This is called yield curve inversion.
    MongoDB Query: [
        { "$match": { "$expr": { "$gt": ["$two_year_yield", "$ten_year_yield"] } } },
        { "$count": "two_year_treasury" }
    ]
    
    Question: How many times has the 2-year treasury yield been below the 10-year treasury yield?
    MongoDB Query: [
        { "$match": { "$expr": { "$lt": ["$two_year_yield", "$ten_year_yield"] } } }
    ]
    
    Question: When was the most recent yield curve inversion i.e. the 2-year treasury yield was above the 10-year treasury yield?
    MongoDB Query: [
        { "$match": { "$expr": { "$gt": ["$two_year_yield", "$ten_year_yield"] } } },
        { "$sort": { "date": -1 } },
        { "$limit": 1 }
    ]
    
    Question: What is the highest yield the 2-year treasury yield has reached over the last 2 years?
    MongoDB Query:
        [
            { "$match": { "date": { "$gte": "n_years_ago" } } },
            { "$sort": { "two_year_yield": -1 } },
            { "$limit": 1 }
        ]

    Question: What is the highest yield the 2-year treasury yield has reached over the last 4 years?
    MongoDB Query:
        [
            { "$match": { "date": { "$gte": "n_years_ago" } } },
            { "$sort": { "two_year_yield": -1 } },
            { "$limit": 1 }
        ]
    
    Question: What is the highest yield the 10-year treasury yield has reached over the entire dataset?
    MongoDB Query:
        [
            { "$sort": { "ten_year_yield": -1 } },
            { "$limit": 1 }
        ]
    
    Use the above to produce a MongoDB query for the following question. Do NOT include the words "MongoDB Query:" in your response. Just return the query itself.
    
    User question: ${userQuestion}`;

    const response = await model.generate([prompt]);
    let mongoQuery = response.generations[0][0].text.replace('MongoDB Query: ', '').trim();
    // Remove trailing commas from arrays in JSON strings
    let cleanedMongoQuery = mongoQuery.replace(/MongoDB Query:\s*(\[[^\]]*])/g, '$1').replace(/\,\s*\]/g, ']');

    // Extract the number of years from the user's question
    const yearsMatch = userQuestion.match(/(\d+)\s?year/);
    const numberOfYears = yearsMatch ? parseInt(yearsMatch[1], 10) : 1;
    // console.log(`yearsMatch ${yearsMatch}`);

    // If the user's question mentions a specific number of years, replace the placeholder
    if (yearsMatch) {
        // Calculate the date n years ago
        const nYearsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - numberOfYears));
        
        // Format the date to match the database format
        const formattedDate = nYearsAgo.toISOString().split('.')[0] + '.000+00:00';
        
        // Convert the cleanedMongoQuery string into a JSON object
        let parsedQuery = JSON.parse(cleanedMongoQuery);
        
        // Update the date comparison in the query to use the $dateFromString function with $expr
        parsedQuery[0].$match.date = { "$gte": { "$dateFromString": { "dateString": formattedDate } } };
        
        // Convert the parsedQuery object back into a JSON string
        cleanedMongoQuery = JSON.stringify(parsedQuery);
    }
        

    console.log(`MongoDB query is ${cleanedMongoQuery}`);
    const uri = process.env.MONGO_URI;
    
    // Connect to the MongoDB database
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Get the collection to run the query against
    const collection = client.db().collection('treasurydatas');

    let pipeline;
    try {
        pipeline = JSON.parse(cleanedMongoQuery);
    } catch (e) {
        console.error(`Error parsing MongoDB query: ${e}`);
        return res.status(500).json({ message: 'Sorry I am not sure.' });
    }
    
    try{

        const result = await collection.aggregate(pipeline).toArray();
    
    
        // Close the MongoDB connection
        await client.close();
    
        const finalPrompt = `A user has asked the following question: ${userQuestion}. Your MongoDB query was: ${mongoQuery}. The result of the query was: ${JSON.stringify(result)}. Reply back to the user with the final answer to their question.`
        const finalQuery = await model.generate([finalPrompt]);
        const finalResponose = finalQuery.generations[0][0].text;
    
        console.log(`result: ${JSON.stringify(result)}`);
        console.log(`final response: ${finalResponose}`);
    
        // Return the result
        res.status(200).json({ message: finalResponose });
    }catch(err){
        res.status(500).json({ message: 'Sorry I am not sure.' });
    }
}