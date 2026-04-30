import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface LandingPageProps {
  handleLogin: () => void;
  loginError: string | null;
  hookDebt: number;
  setHookDebt: (val: number) => void;
  hookRate: number;
  setHookRate: (val: number) => void;
  onNext: () => void;
}

export function LandingPage({
  handleLogin,
  loginError,
  hookDebt,
  setHookDebt,
  hookRate,
  setHookRate,
  onNext
}: LandingPageProps) {
  return (
    <>
      <div className="space-y-8">
        <h1 className="text-7xl md:text-8xl font-bold tracking-tighter leading-[0.85] uppercase">
          Stop Guessing.<br />
          <span className="text-[#F27D26]">Start Solving.</span>
        </h1>
        <p className="max-w-xl text-lg opacity-60">
          The only AI strategist that uses deterministic math to compare your high-interest debt against market ROI. No hallucinations. Just ROI.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onNext}
            className="bg-[#F27D26] text-black px-8 py-4 font-bold text-lg rounded-sm hover:scale-105 transition-transform flex items-center gap-2"
          >
            BEGIN THE INTERROGATION <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-8 backdrop-blur-md relative group">
        <div className="absolute -top-4 -right-4 bg-[#F27D26] text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest animate-bounce">
          Lead Magnet
        </div>
        <div>
          <span className="text-[#F27D26] font-mono text-xs tracking-widest uppercase">Tool: Interest Killer</span>
          <h2 className="text-3xl font-bold tracking-tight mt-2 italic serif">The Lazy Interest Trap.</h2>
        </div>

        <div className="space-y-6">
          <div className="border-l-2 border-[#F27D26] pl-6 py-2">
            <label className="block text-xs uppercase tracking-widest opacity-40 mb-2">Total Debt Amount (₹)</label>
            <input 
              type="number" 
              value={hookDebt}
              onChange={(e) => setHookDebt(Number(e.target.value))}
              className="bg-transparent border-b border-white/20 w-full py-2 text-3xl font-mono focus:outline-none focus:border-[#F27D26] transition-colors"
            />
          </div>
          <div className="border-l-2 border-white/10 pl-6 py-2">
            <label className="block text-xs uppercase tracking-widest opacity-40 mb-2">Interest Rate (APR %)</label>
            <input 
              type="number" 
              value={hookRate}
              onChange={(e) => setHookRate(Number(e.target.value))}
              className="bg-transparent border-b border-white/20 w-full py-2 text-3xl font-mono focus:outline-none focus:border-[#F27D26] transition-colors"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
          <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Projected 10-Year Interest</p>
          <p className="text-5xl font-bold tracking-tighter text-[#F27D26] animate-pulse">
            ₹{formatINR(hookDebt * (hookRate / 100) * 10)}
          </p>
          <p className="text-xs opacity-60 mt-4 leading-relaxed">
            You are set to pay this in <span className="text-white font-bold italic">"Lazy Interest"</span> to the bank. Click below to kill it using AI.
          </p>
          <button 
            onClick={onNext}
            className="w-full mt-8 bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2"
          >
            Kill This Interest <Zap size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
