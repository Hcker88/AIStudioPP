/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

interface FreedomClockProps {
  initialSeconds: number;
  variant?: 'DEFAULT' | 'COMPACT';
  principal?: number;
  annualInterestRate?: number;
}

export function FreedomClock({ 
  initialSeconds, 
  variant = 'DEFAULT',
  principal = 0,
  annualInterestRate = 0
}: FreedomClockProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [currentInterest, setCurrentInterest] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1));
      
      // Calculate real-time interest accumulation if data is provided
      if (principal > 0 && annualInterestRate > 0) {
        // Indian banks typically compound monthly, but calculate daily interest
        const dailyRate = (annualInterestRate / 100) / 365;
        const interestPerSecond = (principal * dailyRate) / (24 * 60 * 60);
        setCurrentInterest(prev => prev + interestPerSecond);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [principal, annualInterestRate]);

  const timeString = useMemo(() => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  }, [seconds]);

  if (variant === 'COMPACT') {
    return (
      <span className="text-xs font-mono font-bold tabular-nums text-[#F27D26]">
        {timeString}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#F27D26]">
          <Zap size={12} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Freedom Clock</span>
        </div>
        {principal > 0 && (
          <div className="text-[10px] font-mono text-red-400 opacity-80">
            +₹{currentInterest.toFixed(4)} interest added
          </div>
        )}
      </div>
      <motion.div 
        key={seconds}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="text-3xl lg:text-5xl font-bold tracking-tighter font-mono tabular-nums"
      >
        {timeString}
      </motion.div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-[#F27D26]"
          initial={{ width: "0%" }}
          animate={{ width: "65%" }} // Mock progress
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
