import { OpenAI } from "langchain/llms/openai";

export default async function handler(req, res) {
    const model = new OpenAI({ temperature: 0.9 }, {openAIApiKey: process.env.OPENAI_API_KEY});
    const { userQuestion } = req.body;
    console.log(`User question is ${userQuestion}`);
    const prompt = `You are an AI model that translates natural language queries about United States government treasury bond yields into MongoDB queries. Given a question, you will provide the corresponding MongoDB query.

    Question: How many times has the 2-year treasury yield been above the 10-year treasury yield? This is called yield curve inversion.
    MongoDB Query: { $expr: { $gt: ["two_year_yield", "ten_year_yield"] } }

    Question: How many times has the 2-year treasury yield been below the 10-year treasury yield?
    MongoDB Query: { $expr: { $lt: ["two_year_yield", "ten_year_yield"] } }

    Question: What is the highest yield the 2-year treasury yield has reached over the last 1 year?
    MongoDB Query:
        {
            $and: [
            { date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } },
            { date: { $lte: new Date() } }
            ],
            $sort: { two_year_yield: -1 },
            $limit: 1
        } 

    Question: What is the highest yield the 2-year treasury yield has reached over the last 2 years?
    MongoDB Query:
        {
            $and: [
            { date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 2)) } },
            { date: { $lte: new Date() } }
            ],
            $sort: { two_year_yield: -1 },
            $limit: 1
        }

    Question: What is the highest yield the 10-year treasury yield has reached over the entire dataset?
    MongoDB Query: { $sort: { ten_year_yield: -1 }, $limit: 1 }

    Use the above to produce a MongoDB query for the following question, ensuring you only reply with the MongoDB query, 
    no other words or numbers that are not part of the query:

    ${userQuestion}`;

    const response = await model.generate([prompt]);
    const mongoQuery = response.generations[0][0].text.replace('MongoDB Query: ', '');
    console.log(mongoQuery);
    res.status(200).json({ query: mongoQuery});
}
