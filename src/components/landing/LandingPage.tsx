import React, { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

function Counter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => formatINR(latest, true, false).replace('₹', ''));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1 });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

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
      <div className="space-y-14">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[1.1] uppercase">
          Stop Guessing.<br />
          <span className="text-[#F27D26]">Start Solving.</span>
        </h1>
        <p className="max-w-xl text-2xl font-light opacity-80">
          The only AI strategist that uses deterministic math to compare your high-interest debt against market ROI. No hallucinations. Just ROI.
        </p>
        <div className="flex flex-col gap-4">
          <button 
            onClick={onNext}
            className="bg-[#F27D26] text-black px-8 py-4 font-bold text-lg rounded-lg shadow-lg shadow-orange-500/20 hover:bg-[#FF8C35] transition-all flex items-center justify-center gap-2"
          >
            BEGIN THE INTERROGATION <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center gap-2 text-xs opacity-60">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Your financial data is private, securely stored, and never shared.</span>
          </div>
        </div>
      </div>

      <div className="bg-[#18181f] border border-white/8 p-6 rounded-sm space-y-8 backdrop-blur-md relative group">
        <div className="absolute -top-4 -right-4 bg-[#F27D26]/10 border border-[#F27D26]/20 text-[#F27D26] text-xs font-bold px-3 py-1 uppercase tracking-widest flex items-center gap-1 rounded-sm">
          ✦ Featured Tool
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
              className="bg-white/4 border border-white/10 rounded-md px-4 py-3 w-full text-3xl font-mono focus:outline-none focus:border-[#F27D26] focus:ring-1 focus:ring-[#F27D26]/30 transition-colors"
            />
          </div>
          <div className="border-l-2 border-[#18181f] pl-6 py-2">
            <label className="block text-xs uppercase tracking-widest opacity-40 mb-2">Interest Rate (APR %)</label>
            <input 
              type="number" 
              value={hookRate}
              onChange={(e) => setHookRate(Number(e.target.value))}
              className="bg-white/4 border border-white/10 rounded-md px-4 py-3 w-full text-3xl font-mono focus:outline-none focus:border-[#F27D26] focus:ring-1 focus:ring-[#F27D26]/30 transition-colors"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-white/8">
          <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Projected 10-Year Interest</p>
          <motion.p className="text-5xl font-bold tracking-tighter text-[#F27D26] tabular-nums flex items-baseline">
            <span>₹</span>
            <Counter value={hookDebt * (hookRate / 100) * 10} />
          </motion.p>
          <p className="text-sm font-light opacity-60 mt-4 leading-relaxed">
            You are set to pay this in <span className="text-white font-bold italic">"Lazy Interest"</span> to the bank. Click below to kill it using AI.
          </p>
          <button 
            onClick={onNext}
            className="w-full mt-8 bg-white/5 border border-white/10 text-white rounded-lg py-4 font-bold flex items-center justify-center gap-2 hover:bg-[#1f1f28] hover:border-[#F27D26]/50 transition-all"
          >
            Kill This Interest <Zap size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
