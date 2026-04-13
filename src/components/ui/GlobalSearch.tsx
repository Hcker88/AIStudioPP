/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, X, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalSearchProps {
  onSearch: (query: string) => void;
}

/**
 * Global Search (Command + K)
 * A high-end search bar for quick navigation and AI-driven queries.
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-all group"
      >
        <Search size={14} className="opacity-40 group-hover:opacity-100" />
        <span className="text-[10px] uppercase tracking-widest opacity-40 group-hover:opacity-100">Ask the AI...</span>
        <div className="flex items-center gap-1 ml-4 px-1.5 py-0.5 bg-white/10 rounded-sm">
          <Command size={10} className="opacity-40" />
          <span className="text-[9px] font-bold opacity-40">K</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-sm shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-6 flex items-center gap-4 border-b border-white/10">
                <Sparkles size={20} className="text-[#F27D26]" />
                <input 
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What happens if I save 10k more? / Show my car loan..."
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-20"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-20 uppercase tracking-widest">Enter to ask</span>
                  <ArrowRight size={14} className="opacity-20" />
                </div>
              </form>

              <div className="p-4 bg-white/[0.02]">
                <p className="text-[9px] uppercase tracking-widest opacity-20 mb-4 px-2">Suggestions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Show my car loan interest",
                    "What happens if I save 10k more?",
                    "Analyze my protection gap",
                    "Check tax-loss harvesting",
                    "Simulate a medical emergency"
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        setQuery(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="text-left px-3 py-2 text-xs opacity-40 hover:opacity-100 hover:bg-white/5 rounded-sm transition-all flex items-center gap-2"
                    >
                      <ArrowRight size={10} className="opacity-20" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-white/10 flex justify-between items-center bg-black">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded-sm text-[9px] font-bold">ESC</kbd>
                    <span className="text-[9px] opacity-40 uppercase tracking-widest">Close</span>
                  </div>
                </div>
                <span className="text-[9px] opacity-20 uppercase tracking-widest">AI Engine v1.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
