/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ChevronDown, ChevronUp, Zap, ShieldAlert, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusHologramProps {
  health: 'GREEN' | 'YELLOW' | 'RED';
  metrics: {
    interestSaved: number;
    burnRate: number;
    wealthVelocity: number;
  };
  onDeepDive?: () => void;
}

export function StatusHologram({ health, metrics, onDeepDive }: StatusHologramProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    GREEN: {
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
      label: 'Beating Interest',
      description: 'Your wealth is growing faster than your debt costs.'
    },
    YELLOW: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
      label: 'Rising Burn Rate',
      description: 'Your expenses are creeping up. Watch your spillover.'
    },
    RED: {
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      label: 'Debt Dominant',
      description: 'Your debt interest is outpacing your wealth creation.'
    }
  };

  const config = statusConfig[health];

  return (
    <div className="relative">
      <motion.div 
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "cursor-pointer p-4 rounded-sm border transition-all duration-500",
          config.bg,
          config.border,
          config.glow,
          isExpanded ? "w-80" : "w-64"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-black/20", config.color)}>
              <Activity size={18} className={cn(health === 'RED' && "animate-pulse")} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Financial Pulse</p>
              <h3 className={cn("text-sm font-bold uppercase tracking-tight", config.color)}>{config.label}</h3>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={14} className="opacity-30" /> : <ChevronDown size={14} className="opacity-30" />}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
                <p className="text-[11px] opacity-60 leading-relaxed">{config.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40">Burn Rate</p>
                    <p className="text-xs font-mono font-bold">₹{metrics.burnRate.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40">Velocity</p>
                    <p className="text-xs font-mono font-bold text-green-500">+{metrics.wealthVelocity}%</p>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeepDive?.();
                  }}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  Open Stress Test Deep-Dive <Zap size={12} className="text-[#F27D26]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
