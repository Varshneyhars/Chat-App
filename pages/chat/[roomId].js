import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import axios from 'axios';
import Header from '../../components/Header';

let socket;

export default function ChatRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState('');
  const userName = router.query.name || 'Anonymous'; // Default to 'Anonymous' if name is not provided

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Initialize socket connection
  useEffect(() => {
    if (!roomId) return;

    socket = io(backendUrl);

    socket.emit('joinRoom', roomId);

    // Fetch past messages
    axios.get(`${backendUrl}/api/messages/${roomId}`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => {
        console.error('Error fetching messages:', err);
      });

    // Socket listeners
    socket.on('newMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on('typing', ({ userName }) => {
      setTyping(`${userName} is typing...`);
    });

    socket.on('stopTyping', () => {
      setTyping('');
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [roomId, backendUrl]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await axios.post(`${backendUrl}/api/messages`, { roomId, userName, message });
      setMessage('');
      socket.emit('stopTyping', roomId);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle typing event
  const handleTyping = useCallback(() => {
    socket.emit('typing', { roomId, userName });
  }, [roomId, userName]);

  return (
    <div className="flex flex-col h-screen bg-gray-200">
      <Header title="ChatRoom Project" />
      <div className="container mx-auto flex-1 max-w-4xl p-4 sm:max-w-3xl md:max-w-2xl lg:max-w-xl">
        <div className="flex flex-col h-full bg-white border rounded-lg shadow-lg">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.user_name === userName ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start ${msg.user_name === userName ? 'flex-row-reverse' : 'flex-row'
                      }`}
                  >
                    <img
                      src="/profile.png" // Ensure this path is correct and matches the location in the 'public' directory
                      alt="Profile Icon"
                      className="w-10 h-10 rounded-full border border-gray-300 mx-2"
                    />
                    <div
                      className={`max-w-xs p-3 rounded-lg shadow-md ${msg.user_name === userName
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800'
                        }`}
                      style={{
                        marginLeft: msg.user_name === userName ? '0' : '8px',
                        marginRight: msg.user_name === userName ? '8px' : '0',
                      }}
                    >
                      <strong className={`block text-sm ${msg.user_name === userName ? 'text-white' : 'text-gray-700'
                        }`}>
                        {msg.user_name}
                      </strong>
                      <p className="mt-1 text-base">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {typing && <p className="italic text-gray-600 mt-2">{typing}</p>}
          </div>
          <div className="p-4 bg-white border-t rounded-b-lg shadow-md">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg text-base"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
            />
            <button
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
