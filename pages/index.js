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
    setReply(JSON.stringify(data));
  }

  const handleChange = (e) => {
    setInput(e.target.value);
  }

  const handleClear = () => {
    setInput("");
  }

  return (
    <div className='w-screen min-h-screen flex justify-center items-center'>
      <div className="flex flex-col justify-center items-center">
        <h1 className='text-3xl w-full text-white text-center '>Ask A Question About the 2 and 10 Year Treasury Yields</h1>
        <div className='w-[60vw] p-10 flex flex-col justify-center border rounded-lg shadow-xl mt-10 '>
          <form onSubmit={handleSubmit}
            className="flex flex-col justify-center"
          >
            <label className="text-left">Question</label>
            <input 
              onChange={handleChange}
              className="my-2 text-gray-800 py-1 px-1" type="text" 
              value={input}
            />
            <button type="submit" className="w-[200px] py-1 px-3 border border-white rounded-md mt-4 hover:bg-white hover:text-black">Submit</button>
            <button onClick={handleClear} className="w-[200px] py-1 px-3 border border-white rounded-md mt-4 hover:bg-white hover:text-black">Clear</button>
          </form>
          <div className="w-full p-4 mt-5">
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
