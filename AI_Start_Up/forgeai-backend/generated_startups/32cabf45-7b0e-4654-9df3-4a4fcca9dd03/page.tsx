'use client';
import { useState, useEffect, useRef } from 'react';

export default function MVP() {
  const [messages, setMessages] = useState([
    { role: 'system', text: 'Hello! I am your advanced AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if(!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'system', text: data.response || data.error }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', text: 'Error connecting to AI backend.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#18181b] border-r border-[#27272a] hidden md:flex flex-col">
        <div className="p-4 border-b border-[#27272a]">
          <h2 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            fram connect
          </h2>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Chats</div>
          {"Project Architecture".split(',').map((chat, i) => (
            <div key={i} className="px-3 py-2 text-sm text-gray-300 hover:bg-[#27272a] rounded-lg cursor-pointer transition-colors">
              💬 {chat}
            </div>
          ))}
          <div className="px-3 py-2 text-sm text-gray-300 hover:bg-[#27272a] rounded-lg cursor-pointer transition-colors">
            💬 Marketing Strategy
          </div>
          <div className="px-3 py-2 text-sm text-gray-300 hover:bg-[#27272a] rounded-lg cursor-pointer transition-colors">
            💬 Bug Debugging
          </div>
        </div>
        <div className="p-4 border-t border-[#27272a] text-sm text-gray-400 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
          <span>Pro Plan Active</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Topbar */}
        <div className="h-14 border-b border-[#27272a] flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="font-medium">Model: <span className="text-blue-400">ForgeAI-Omni-v1</span></div>
          <button className="text-sm px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
            Share Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#18181b] border border-[#27272a] text-gray-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4 flex-row">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-sm">AI</div>
                <div className="max-w-[80%] rounded-2xl p-4 bg-[#18181b] border border-[#27272a] text-gray-200 rounded-tl-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Box */}
        <div className="p-4 bg-gradient-to-t from-[#09090b] to-transparent pt-10">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message ForgeAI..." 
              className="w-full bg-[#27272a] border border-[#3f3f46] rounded-2xl pl-6 pr-16 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xl transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
          <div className="text-center text-xs text-gray-500 mt-3">
            ForgeAI can make mistakes. Consider verifying important information.
          </div>
        </div>

      </div>
    </div>
  );
}