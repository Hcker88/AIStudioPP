import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  ShieldCheck, 
  Database,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

const STRATEGIST_THOUGHTS = [
  "Analyzing current liability structure...",
  "Detecting high-interest personal loan (14.5% APR).",
  "Evaluating equity portfolio performance vs debt cost.",
  "Calculating optimal payoff trajectory...",
  "Drafting recommendation: Liquidate 15% of equity to clear personal loan.",
  "Projecting 10-year net worth impact: +₹12,40,000.",
  "Finalizing strategy."
];

export function StressTestEngine() {
  const [syncState, setSyncState] = useState<'IDLE' | 'SYNCING' | 'DONE'>('IDLE');
  const [bankStatuses, setBankStatuses] = useState([
    { name: 'ICICI Bank', type: 'Savings', status: 'IDLE' },
    { name: 'HDFC Bank', type: 'Home Loan', status: 'IDLE' },
    { name: 'Zerodha', type: 'Equity', status: 'IDLE' },
    { name: 'Salt Edge (Aggregator)', type: 'API', status: 'IDLE' }
  ]);

  const [monteCarloState, setMonteCarloState] = useState<'IDLE' | 'RUNNING' | 'DONE'>('IDLE');
  const [mcProgress, setMcProgress] = useState(0);

  const [thoughtIndex, setThoughtIndex] = useState(-1);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  const handleSync = () => {
    setSyncState('SYNCING');
    setBankStatuses(prev => prev.map(b => ({ ...b, status: 'SYNCING' })));
    
    setTimeout(() => {
      setBankStatuses([
        { name: 'ICICI Bank', type: 'Savings', status: 'SUCCESS' },
        { name: 'HDFC Bank', type: 'Home Loan', status: 'SUCCESS' },
        { name: 'Zerodha', type: 'Equity', status: 'PARTIAL' }, // Simulating partial sync
        { name: 'Salt Edge (Aggregator)', type: 'API', status: 'FAILED' } // Simulating flaky aggregator
      ]);
      setSyncState('DONE');
    }, 2500);
  };

  const runMonteCarlo = () => {
    setMonteCarloState('RUNNING');
    setMcProgress(0);
    
    const interval = setInterval(() => {
      setMcProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setMonteCarloState('DONE');
          startStrategistStream();
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const startStrategistStream = () => {
    setThoughtIndex(0);
    setAuditComplete(false);
    setIsAuditing(false);
  };

  useEffect(() => {
    if (thoughtIndex >= 0 && thoughtIndex < STRATEGIST_THOUGHTS.length) {
      const timer = setTimeout(() => {
        setThoughtIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (thoughtIndex === STRATEGIST_THOUGHTS.length) {
      setIsAuditing(true);
      setTimeout(() => {
        setIsAuditing(false);
        setAuditComplete(true);
      }, 2000);
    }
  }, [thoughtIndex]);

  return (
    <div className="space-y-8">
      {/* Pothole 2: The "Mock" Wall - Graceful Degradation */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Database size={16} className="text-[#F27D26]" /> 
              Data Aggregation Layer
            </h3>
            <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">
              Handling flaky real-world bank APIs gracefully.
            </p>
          </div>
          <button 
            onClick={handleSync}
            disabled={syncState === 'SYNCING'}
            className="px-4 py-2 bg-[#F27D26]/10 border border-[#F27D26] text-[#F27D26] text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(syncState === 'SYNCING' && "animate-spin")} />
            {syncState === 'SYNCING' ? 'Syncing...' : 'Force Sync'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankStatuses.map((bank, i) => (
            <div key={i} className="p-4 bg-black/20 border border-white/5 rounded-sm">
              <p className="text-xs font-bold">{bank.name}</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-3">{bank.type}</p>
              <div className="flex items-center gap-2">
                {bank.status === 'IDLE' && <div className="w-2 h-2 rounded-full bg-white/20" />}
                {bank.status === 'SYNCING' && <RefreshCw size={12} className="animate-spin text-blue-400" />}
                {bank.status === 'SUCCESS' && <CheckCircle2 size={12} className="text-green-500" />}
                {bank.status === 'PARTIAL' && <AlertTriangle size={12} className="text-yellow-500" />}
                {bank.status === 'FAILED' && <XCircle size={12} className="text-red-500" />}
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  bank.status === 'SUCCESS' && "text-green-500",
                  bank.status === 'PARTIAL' && "text-yellow-500",
                  bank.status === 'FAILED' && "text-red-500",
                  bank.status === 'SYNCING' && "text-blue-400",
                  bank.status === 'IDLE' && "opacity-40"
                )}>
                  {bank.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {syncState === 'DONE' && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm flex items-start gap-3">
            <AlertTriangle className="text-yellow-500 shrink-0" size={14} />
            <p className="text-[10px] text-yellow-200/80 leading-relaxed">
              <span className="font-bold text-yellow-500 uppercase">Logic Healer Active:</span> 
              Salt Edge sync failed. Falling back to last known good state for Zerodha (Partial). Stress test will proceed with degraded confidence bounds.
            </p>
          </div>
        )}
      </div>

      {/* Pothole 3: Monte Carlo Cost & Stress Test Explanation */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Cpu size={16} className="text-[#F27D26]" /> 
              Monte Carlo Stress Test
            </h3>
            <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">
              Simulating 100 possible futures to find the safest path.
            </p>
          </div>
          <button 
            onClick={runMonteCarlo}
            disabled={monteCarloState === 'RUNNING'}
            className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 disabled:opacity-50 hover:bg-gray-200"
          >
            <Zap size={14} />
            {monteCarloState === 'RUNNING' ? 'Running 100 Iterations...' : 'Trigger Stress Test'}
          </button>
        </div>

        {/* Simplification: Explain Stress Test clearly */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-sm">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShieldCheck size={14} /> What is a Stress Test?
          </h4>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Think of a <strong>Stress Test</strong> like a crash test for your finances. We simulate worst-case scenarios—like a sudden job loss, a 20% market crash, or unexpected medical bills—to see if your current savings and debt plan can survive without breaking. If the test fails, the AI adjusts your strategy to build a bigger safety net first.
          </p>
        </div>

        {monteCarloState !== 'IDLE' && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
              <span>Simulation Progress</span>
              <span>{mcProgress}%</span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#F27D26]"
                initial={{ width: 0 }}
                animate={{ width: `${mcProgress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pothole 1: Latency (Streaming UI + Auditor) */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-sm min-h-[300px]">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
          <Activity size={16} className="text-[#F27D26]" /> 
          Strategist Stream & Auditor Patch
        </h3>
        
        <div className="space-y-4 font-mono text-sm">
          <AnimatePresence>
            {STRATEGIST_THOUGHTS.map((thought, idx) => (
              idx <= thoughtIndex && (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <span className="text-[#F27D26] opacity-50">{`>`}</span>
                  <p>{thought}</p>
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {isAuditing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-blue-400 mt-8 pt-4 border-t border-white/10"
            >
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs uppercase tracking-widest">Auditor verifying strategy constraints...</span>
            </motion.div>
          )}

          {auditComplete && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-sm flex items-start gap-4"
            >
              <ShieldCheck className="text-green-500 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Auditor Verified</h4>
                <p className="text-[11px] text-green-200/80 leading-relaxed">
                  Strategy patched and verified. The proposed liquidation of 15% equity does not violate the long-term retirement corpus constraints. Safe to execute.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
