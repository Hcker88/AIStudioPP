import React from 'react';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatINR } from '@/src/lib/formatters';

interface LoanRowProps {
  name: string;
  apr: number;
  emi: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isPrivacyMode?: boolean;
  highlight?: boolean;
  onClose?: () => void;
}

export const LoanRow: React.FC<LoanRowProps> = ({ name, apr, emi, priority, isPrivacyMode, highlight, onClose }) => {
  const priorityColors = {
    HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
    MEDIUM: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };

  return (
    <div className={cn(
      "group flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02] transition-all duration-500",
      highlight && "animate-pulse-glow bg-[#F27D26]/5"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#F27D26]/10 transition-colors">
          <CreditCard size={18} className="opacity-40 group-hover:text-[#F27D26] group-hover:opacity-100 transition-all" />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight">{name}</h4>
          <p className={cn("text-[10px] opacity-30 uppercase tracking-widest mt-0.5 transition-all duration-300", isPrivacyMode && "blur-sm select-none")}>
            Monthly EMI: {formatINR(emi, true, isPrivacyMode)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className="text-sm font-mono font-bold">{apr}%</div>
          <div className="text-[9px] opacity-30 uppercase tracking-tighter">Interest Rate</div>
        </div>
        
        <div className={cn(
          "px-2 py-1 rounded-sm text-[9px] font-bold border uppercase tracking-widest",
          priorityColors[priority]
        )}>
          {priority} PRIORITY
        </div>

        <button 
          onClick={onClose}
          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20 rounded-sm text-[9px] font-bold uppercase tracking-widest hover:bg-[#F27D26] hover:text-black"
        >
          Slay
        </button>
      </div>
    </div>
  );
}
