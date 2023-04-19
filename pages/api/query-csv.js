import { CSVLoader } from "langchain/document_loaders/fs/csv";

const loader = new CSVLoader("../../treasury_data.csv");
const docs = await loader.load();

const prompt = `You are an AI model that translates natural language queries about united states governemnt treasury bond yields into MongoDB queries. Given a question, you will provide the corresponding MongoDB query.

    Question: How many times has the 2-year treasury yield been above the 10-year treasury yield? This is called yield curve inversion.
    MongoDB Query: { $expr: { $gt: ['$2 year yield', '$10 year yield'] } }

    Question: How many times has the 2-year treasury yield been below the 10-year treasury yield?
    MongoDB Query: { $expr: { $lt: ['$two_year_yield', '$ten_year_yield'] } }

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
`;


export default function handler(req, res) {
    res.status(200).json({ name: 'John Doe' })
  }