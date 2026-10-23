import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldCheck, Info } from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string | React.ReactNode;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const initiateChat = async () => {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 1200));
      setMessages([
        { 
          id: '1', 
          sender: 'bot', 
          text: (
            <div>
               <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">வணக்கம்! உரிமை AI</h3>
               <p className="text-gray-600 leading-relaxed">
                 உங்களுக்குத் தேவையான அரசுத் திட்டங்களை நொடியில் கண்டறியலாம். உங்கள் வேலையை கீழே தேர்ந்தெடுக்கவும் அல்லது தட்டச்சு செய்யவும்.
               </p>
            </div>
          ) 
        },
      ]);
      setIsTyping(false);
    };
    initiateChat();
  }, []);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let response: React.ReactNode = 'தகவல்களை ஆராய்கிறேன்...';
      const lText = text.toLowerCase();
      
      if (lText.includes('விவசாயி') || lText.includes('farmer')) {
        response = (
          <div className="flex flex-col gap-3">
            <p className="text-gray-700 font-medium">விவசாயிகளுக்கான சிறந்த திட்டங்கள்:</p>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">பி.எம் கிசான் திட்டம்</h4>
                  <p className="text-sm mt-1 text-gray-500">விவசாயிகள் நிதி உதவி</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2.5 py-1 rounded-lg font-bold">₹6000 / வருடம்</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Info className="w-4 h-4 text-emerald-500" />
                <span>தேவை: ஆதார், நிலப்பட்டா</span>
              </div>
            </div>
          </div>
        );
      } else {
        response = 'உங்கள் தகவலைப் பதிவு செய்தேன். உங்கள் மாவட்டத்தைக் குறிப்பிட முடியுமா?';
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-emerald-200">
      
      {/* Ambient Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/40 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-200/40 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white flex flex-col h-[85vh] relative z-10 overflow-hidden">
        
        {/* Sleek Header */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-gray-100/50 bg-white/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">உரிமை AI</h1>
              <p className="text-sm text-gray-500 font-medium tracking-wide">அரசு திட்ட வழிகாட்டி</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-700 tracking-wide">ONLINE</span>
          </div>
        </header>

        {/* Chat Canvas */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col gap-6 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mr-3 mt-2 flex-shrink-0">
                     <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                )}
                
                <div 
                  className={`max-w-[85%] sm:max-w-[75%] ${
                    msg.sender === 'user' 
                      ? 'bg-gray-900 text-white rounded-3xl rounded-tr-sm px-6 py-4 shadow-md font-medium' 
                      : 'bg-white text-gray-800 rounded-3xl rounded-tl-sm px-6 py-5 shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 ml-12 px-6 py-5 bg-white rounded-3xl rounded-tl-sm w-fit border border-gray-100 shadow-sm"
            >
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white/60 backdrop-blur-xl border-t border-gray-100/80">
          
          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {['🌾 விவசாயி', '🎓 மாணவர்', '👩 பெண்கள்', '👴 முதியவர்'].map(reply => (
              <button
                key={reply}
                onClick={() => handleSend(reply)}
                className="flex-shrink-0 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="உங்கள் பதிலை உள்ளிடவும்..."
              className="w-full bg-white border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl pl-6 pr-16 py-4 text-gray-700 placeholder-gray-400 outline-none transition-all shadow-sm text-base font-medium"
            />
            <button
              onClick={() => handleSend()}
              className="absolute right-2 w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
