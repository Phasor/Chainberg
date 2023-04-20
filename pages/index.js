import { useState, useEffect } from 'react'

export default function Home() {
  const [reply, setReply] = useState('')
  const [input, setInput] = useState('') 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/query-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userQuestion: input })
    })
    const data = await res.json();
    console.log(data);
    setReply(data.message);
  }

  const handleChange = (e) => {
    setInput(e.target.value);
  }

  const handleClear = () => {
    setInput("");
  }

  return (
    <div className='w-screen min-h-screen flex justify-center items-center bg-[#121212]'>
      <div className="flex flex-col justify-center items-center">
        <h1 className='text-6xl w-full text-white text-center'>Chainberg</h1>
        <h2 className='text-xl w-full text-white text-center my-4'>Ask A Question About the 2 and 10 Year Treasury Yields</h2>
        <div className='w-[60vw] p-10 flex flex-col justify-center border rounded-lg shadow-xl mt-5 '>
          <form onSubmit={handleSubmit}
            className="flex flex-col justify-center"
          >
            <label className="text-left text-xl">Question</label>
            <input 
              onChange={handleChange}
              className="my-2 text-gray-800 py-2 px-1" type="text border rounded-md" 
              placeholder="What is the highest yield the 2-year treasury yield has reached over the last 1 year?"
              value={input}
            />
            <div className='flex space-x-5'>
              <button type="submit" className="w-[200px] py-1 px-3 border border-white rounded-md mt-4 hover:bg-white hover:text-black">Submit</button>
              <button onClick={handleClear} className="w-[200px] py-1 px-3 border border-white rounded-md mt-4 hover:bg-white hover:text-black">Clear</button>
            </div>
          </form>
          <div className="w-full mt-5">
            <div className="whitespace-pre-wrap">
              <p className="text-xl">Reply</p>
              <p className="text-lg">{reply}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
