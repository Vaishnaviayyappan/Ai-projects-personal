'use client';
import { useState } from 'react';

export default function MVP() {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState([{ role: 'system', text: 'Hello! I am your AI assistant for video. How can I help you today?' }]);
  const [input, setInput] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if(email) setJoined(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if(!input) return;
    setMessages([...messages, { role: 'user', text: input }, { role: 'system', text: 'This is a functional prototype! In production, this would connect to our AI backend.' }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-8 md:p-16 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-16">
        
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            video
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of our platform. This is a fully interactive functional prototype.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Early Access</h2>
          {joined ? (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-medium text-center">
              🎉 Success! You're on the waitlist for video. We'll email you soon.
            </div>
          ) : (
            <form onSubmit={handleJoin} className="flex gap-4">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address" 
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <button type="submit" className="px-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Join Waitlist
              </button>
            </form>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
          <div className="bg-black/40 border-b border-white/10 p-4 font-medium flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-4 text-gray-400 text-sm">App Demo Preview</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-purple-600 self-end rounded-tr-sm' : 'bg-white/10 self-start rounded-tl-sm'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Test the functionality..." 
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            />
            <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors cursor-pointer">
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}