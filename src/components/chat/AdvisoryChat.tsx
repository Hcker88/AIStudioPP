import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useFinance } from '../../contexts/FinanceContext';
import { formatINR } from '../../lib/formatters';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AdvisoryChat() {
  const { profile, processChatMessage } = useFinance();
  const highestLoan = profile?.loans?.length ? profile.loans.reduce((prev, current) => (prev.interestRate > current.interestRate) ? prev : current) : null;
  const highestLoanName = highestLoan ? highestLoan.name : "Debt Free";
  const highestLoanRate = highestLoan ? highestLoan.interestRate : 0;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `I'm analyzing your real-time financial data. Your ${highestLoanName} at ${highestLoanRate}% is the primary target. You can tell me about new income, expenses, or investments here.` }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await processChatMessage(text);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error processing your request. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    `Should I invest ₹10k in Nifty 50 or pay my ${highestLoanName}?`,
    "What is the historical ROI of Gold vs SGB?",
    "Explain the 'guaranteed return' of debt payoff."
  ];

  return (
    <div className="flex flex-col h-full bg-[#18181f] border border-white/8 rounded-xl overflow-hidden backdrop-blur-md relative">
      {/* Header */}
      <div className="p-4 border-b border-white/8 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#F27D26]" />
          <span className="text-xs font-bold uppercase tracking-widest">AI Advisory Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-full">
            <ShieldCheck className="w-3 h-3 text-[#F27D26]" />
            <span className="text-[9px] font-bold text-[#F27D26] uppercase tracking-tighter">Focus: {highestLoanName} @ {highestLoanRate}%</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col gap-2",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] p-3 rounded-lg text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-[#F27D26] text-black font-medium border border-[#F27D26]/20" 
                  : "bg-[#111116] border border-white/8 backdrop-blur-sm shadow-md"
              )}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={cn(line.startsWith('[Verified') ? "mt-3 pt-3 border-t border-white/10 font-mono text-[10px] opacity-60" : "")}>
                    {line}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="bg-white/10 w-12 p-3 rounded-sm flex gap-1 justify-center"
            >
              <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/8 bg-black/20">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {suggestions.map((s, i) => (
            <button 
              key={i}
              onClick={() => handleSend(s)}
              className="whitespace-nowrap px-3 py-1.5 bg-[#111116] border border-white/8 rounded-md text-[11px] font-medium hover:bg-[#1f1f28] hover:border-[#F27D26]/50 transition-all font-mono"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about an investment..."
            className="w-full bg-white/4 border border-white/10 rounded-md px-4 py-3 pr-10 focus:outline-none focus:border-[#F27D26] focus:ring-1 focus:ring-[#F27D26]/30 text-sm transition-colors placeholder:opacity-30"
          />
          <button 
            onClick={() => handleSend()}
            className="absolute right-2 top-2.5 p-1 hover:text-[#F27D26] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
