import { OpenAI } from "langchain/llms/openai";
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    const model = new OpenAI({ temperature: 0.9 }, {openAIApiKey: process.env.OPENAI_API_KEY});
    const { userQuestion } = req.body;
    console.log(`User question is ${userQuestion}`);
    const prompt = `You are an AI model that translates natural language queries about United States government treasury bond yields into MongoDB queries. Given a question, you will provide the corresponding MongoDB query.

    Question: How many times has the 2-year treasury yield been above the 10-year treasury yield? This is called yield curve inversion.
    MongoDB Query: [
        { "$match": { "$expr": { "$gt": ["two_year_yield", "ten_year_yield"] } } }
    ]
    
    Question: How many times has the 2-year treasury yield been below the 10-year treasury yield?
    MongoDB Query: [
        { "$match": { "$expr": { "$lt": ["two_year_yield", "ten_year_yield"] } } }
    ]
    
    Question: Has the 2-year treasury yield ever been higher than the 10-year treasury yield? If so, when?
    MongoDB Query: [
        { "$match": { "$expr": { "$gt": ["two_year_yield", "ten_year_yield"] } } },
        { "$sort": { "date": -1 } },
        { "$limit": 1 }
    ]
    
    Question: What is the highest yield the 2-year treasury yield has reached over the last 1 year?
    MongoDB Query:
        [
            { "$match": { "date": { "$gte": { "$dateToString": { "format": "%Y-%m-%d", "date": { "$subtract": [new Date(), { "$multiply": [365, 24, 60, 60, 1000] }] } } } } } },
            { "$sort": { "two_year_yield": -1 } },
            { "$limit": 1 }
        ]
    
    Question: What is the highest yield the 2-year treasury yield has reached over the last 2 years?
    MongoDB Query:
        [
            { "$match": { "date": { "$gte": { "$dateToString": { "format": "%Y-%m-%d", "date": { "$subtract": [new Date(), { "$multiply": [2, 365, 24, 60, 60, 1000] }] } } } } } },
            { "$sort": { "two_year_yield": -1 } },
            { "$limit": 1 }
        ]
    
    Question: What is the highest yield the 10-year treasury yield has reached over the entire dataset?
    MongoDB Query:
        [
            { "$sort": { "ten_year_yield": -1 } },
            { "$limit": 1 }
        ]
    
    Use the above to produce a MongoDB query for the following question, ensuring you only reply with the MongoDB query, 
    no other words or numbers that are not part of the query. Do not include the word "MongoDB Query:" in your response. Give the dates in your reply where appropriate.
    
    ${userQuestion}`;

    const response = await model.generate([prompt]);
    const mongoQuery = response.generations[0][0].text.replace('MongoDB Query: ', '').trim();
    // Remove trailing commas from arrays in JSON strings
    const cleanedMongoQuery = mongoQuery.replace(/\,\s*\]/g, ']');

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
        return res.status(500).json({ message: 'Internal Server Error' });
    }

    const result = await collection.aggregate(pipeline).toArray();

    // Close the MongoDB connection
    await client.close();

    const finalPrompt = `A user has asked the following question: ${userQuestion}. Your MongoDB query was: ${mongoQuery}. The result of the query was: ${JSON.stringify(result)}. Reply back to the user with the final answer to their question.`
    const finalQuery = await model.generate([finalPrompt]);
    const finalResponose = finalQuery.generations[0][0].text;

    console.log(mongoQuery);
    console.log(`result: ${JSON.stringify(result)}`);
    console.log(`final response: ${finalResponose}`);

    // Return the result
    res.status(200).json({ query: finalResponose });
}