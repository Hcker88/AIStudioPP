import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  isHigh?: boolean; // Triggers the "Glow" border
  trend?: 'up' | 'down';
  isPrivacyMode?: boolean;
  highlight?: boolean;
}

export function StatCard({ label, value, subtext, isHigh, trend, isPrivacyMode, highlight }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-6 bg-white/5 border rounded-sm transition-all duration-500",
        isHigh 
          ? "border-[#F27D26] shadow-[0_0_20px_rgba(242,125,38,0.15)]" 
          : "border-white/10",
        highlight && "animate-pulse-glow"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">{label}</span>
        {trend && (
          <div className={cn(
            "p-1 rounded-full",
            trend === 'up' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </div>
        )}
      </div>
      
      <div className={cn("flex items-baseline gap-1 transition-all duration-300", isPrivacyMode && "blur-md select-none")}>
        <span className="text-4xl font-bold tracking-tighter">{value}</span>
        {label.toLowerCase().includes('rate') && <span className="text-lg opacity-30">%</span>}
      </div>

      {subtext && (
        <p className="mt-4 text-[10px] uppercase tracking-widest opacity-30 font-medium">
          {subtext}
        </p>
      )}

      {isHigh && (
        <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#F27D26]" />
      )}
    </motion.div>
  );
}
