import { useState } from 'react';
import { useRouter } from 'next/router';


export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleJoinRoom = () => {
    const roomId = 1; // Static room ID for simplicity
    router.push(`/chat/${roomId}?name=${name}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-10 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Enter Your Name</h2>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
          onClick={handleJoinRoom}
        >
          Join Chat
        </button>
      </div>
    </div>
  );
}
