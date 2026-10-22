import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Quantum Co-Pilot Online. I can help draft reports, verify policy alignment, or explain the Agent Council mechanics. How can I assist your investigation today?' }
  ]);

  const generateResponse = (input: string) => {
    const text = input.toLowerCase();
    
    // 1. Complaint Drafting Scenario
    if (text.includes("draft") || text.includes("scenario") || text.includes("generate")) {
       if (text.includes("fraud") || text.includes("money")) {
          return "I have synthesized a Financial Integrity Report for you:\n\n'INCIDENT: Unidentified ledger discrepancy detected in the Q3 accounting cycle. Potential breach of SEC Rule 10b-5 observed in the Procurement department.'\n\nWould you like me to refine this scenario further?";
       }
       if (text.includes("harass") || text.includes("bully")) {
          return "I have drafted a Workplace Conduct Violation report:\n\n'INTAKE: Systematic pattern of hostile behavior observed in the engineering wing. Violation of Title VII conduct standards flagged.'\n\nI recommend submitting this anonymously to protect the reporter.";
       }
       return "I can draft a report for you. Please specify if this is related to Financial Fraud, Workplace Ethics, or Data Security?";
    }

    // 2. Knowledge Base Responses
    if (text.includes("agent council") || text.includes("how it works")) {
       return "The Agent Council is a decentralized mesh of 8 specialized AI nodes. Each node handles a specific dimension of compliance (Identity, Ethics, Policy) to ensure non-linear, unbiased decision making.";
    }
    
    if (text.includes("safe") || text.includes("privacy") || text.includes("anonymous")) {
       return "Security is our core protocol. All data is cryptographically scrubbed by the Identity Agent before reaching any cognitive nodes. Your identity remains behind a PII-redacted hash wall.";
    }

    if (text.includes("status") || text.includes("priority")) {
       return "Priority is determined by our Intelligence Agent using semantic vector analysis over your incident description. Urgent flags are raised automatically for financial breaches or physical safety risks.";
    }

    // Default Fallback
    return "Consensus reached. I recommend proceeding with the current workflow. I can also help you draft a specific scenario if you describe the event.";
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMessage = query;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setQuery('');
    
    // Simulate Neural Latency
    setTimeout(() => {
      const aiResponse = generateResponse(userMessage);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }, 800);
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full ai-gradient-bg text-white shadow-2xl shadow-ai/30 flex items-center justify-center z-50 hover:scale-110 transition-transform"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ rotate: 15 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Slide Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-96 h-full bg-background/90 backdrop-blur-3xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 ai-gradient-bg rounded-full shadow-lg shadow-ai/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-lg ai-gradient-text">Co-Pilot</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      m.role === 'ai' ? 'ai-gradient-bg text-white rounded-tl-sm' : 'bg-muted text-foreground ml-auto rounded-tr-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-white/5 bg-background">
              <form onSubmit={handleSend} className="relative flex items-center">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask AI to resolve..."
                  className="pr-12 h-12 rounded-full bg-white/5 border-white/10"
                />
                <Button size="icon" variant="ghost" type="submit" className="absolute right-1 hover:bg-transparent hover:text-ai text-muted-foreground transition-colors">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
