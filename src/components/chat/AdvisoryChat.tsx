import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Sparkles, ArrowRight, ShieldCheck, Bookmark, ShoppingCart, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStrategy } from '../../contexts/StrategyContext';
import { formatINR } from '../../lib/formatters';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AdvisoryChatProps {
  highestLoanName?: string;
  highestLoanRate?: number;
  user?: any;
}

export function AdvisoryChat({ highestLoanName = "Amex", highestLoanRate = 24.99, user }: AdvisoryChatProps) {
  const { extraMonthly, lastSyncMessage, setHighlightedCard, financialData } = useStrategy();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `I've analyzed your profile. Your ${highestLoanName} at ${highestLoanRate}% is the primary target. How can I help you optimize your ROI today?` }
  ]);

  // Acknowledge context changes
  useEffect(() => {
    if (extraMonthly > 25000) {
      const msg: Message = { 
        role: 'assistant', 
        content: `I see you're considering an extra ₹${formatINR(extraMonthly)}/mo contribution. This significantly accelerates your debt-free date. Would you like to see the updated projection?` 
      };
      setMessages(prev => [...prev, msg]);
    }
  }, [extraMonthly]);

  useEffect(() => {
    if (lastSyncMessage) {
      const msg: Message = { role: 'assistant', content: lastSyncMessage };
      setMessages(prev => [...prev, msg]);
    }
  }, [lastSyncMessage]);
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id || 'default-user',
          message: text,
          financialData
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      // Handle strategy highlighting
      const highlightMatch = data.response.match(/\[HIGHLIGHT:(.*?)\]/);
      if (highlightMatch) {
        setHighlightedCard(highlightMatch[1]);
        // Clear highlight after 5 seconds
        setTimeout(() => setHighlightedCard(null), 5000);
      }

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.response.replace(/\[HIGHLIGHT:.*?\]/g, '').trim() 
      };
      setMessages(prev => [...prev, assistantMsg]);
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
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-sm overflow-hidden backdrop-blur-md relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
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
                "max-w-[85%] p-3 rounded-sm text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "ml-auto bg-[#F27D26] text-black font-medium" 
                  : "bg-white/10 border border-white/5 backdrop-blur-sm"
              )}
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={cn(line.startsWith('[Verified') ? "mt-3 pt-3 border-t border-white/10 font-mono text-[10px] opacity-60" : "")}>
                  {line}
                </p>
              ))}
              

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
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {suggestions.map((s, i) => (
            <button 
              key={i}
              onClick={() => handleSend(s)}
              className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-medium hover:bg-white/10 hover:border-[#F27D26]/50 transition-all"
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
            className="w-full bg-transparent border-b border-white/20 py-2 pr-10 focus:outline-none focus:border-[#F27D26] text-sm transition-colors placeholder:opacity-30"
          />
          <button 
            onClick={() => handleSend()}
            className="absolute right-0 top-1.5 p-1 hover:text-[#F27D26] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
