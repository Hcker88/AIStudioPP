/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Bug, Play, Terminal, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function FinancialDebugger() {
  const [jsonInput, setJsonInput] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (window as any).GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this financial state and explain the reasoning for recommending specific action cards (e.g., prepaying debt vs investing). 
        State: ${jsonInput}
        
        Provide a detailed, step-by-step mathematical reasoning.`,
      });
      setExplanation(response.text || 'No explanation generated.');
    } catch (error) {
      setExplanation(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-gray-400 rounded-full hover:text-white transition-colors opacity-20 hover:opacity-100 z-50"
        title="Open Financial Debugger"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/90 z-[100] p-8 flex flex-col gap-6 overflow-hidden"
    >
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="text-[#F27D26]" />
          <h2 className="text-xl font-bold tracking-tighter uppercase">debug_financial_logic()</h2>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        <div className="flex flex-col gap-4">
          <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Input JSON State</label>
          <textarea 
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{ "income": 100000, "loans": [...] }'
            className="flex-1 bg-black border border-white/10 p-4 font-mono text-sm focus:outline-none focus:border-[#F27D26] resize-none"
          />
          <button 
            onClick={handleDebug}
            disabled={loading || !jsonInput}
            className="bg-[#F27D26] text-black font-bold py-4 flex items-center justify-center gap-2 hover:bg-[#ff8c3a] disabled:opacity-50 transition-colors"
          >
            {loading ? 'ANALYZING...' : 'RUN DIAGNOSTIC'} <Play size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-hidden">
          <label className="text-[10px] uppercase tracking-widest opacity-50 font-bold">AI Reasoning Output</label>
          <div className="flex-1 bg-gray-900 border border-white/10 p-6 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-gray-300">
            {explanation || 'Awaiting input...'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
