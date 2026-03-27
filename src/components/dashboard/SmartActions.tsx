/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldAlert, ArrowRight, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ActionCardProps {
  type: 'WIN' | 'PROTECTION';
  title: string;
  description: string;
  onClick: () => void;
}

function ActionCard({ type, title, description, onClick }: ActionCardProps) {
  const isWin = type === 'WIN';

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full p-8 lg:p-12 text-left rounded-sm border transition-all duration-300 group overflow-hidden",
        isWin 
          ? "bg-[#F27D26] text-black border-[#F27D26] shadow-[0_0_40px_rgba(242,125,38,0.2)]" 
          : "bg-white/5 text-white border-white/10 hover:border-[#F27D26]/50"
      )}
    >
      <div className="relative z-10 flex flex-col h-full justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {isWin ? <Zap size={24} /> : <ShieldAlert size={24} className="text-[#F27D26]" />}
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isWin ? "text-black/60" : "text-[#F27D26]"
            )}>
              {isWin ? "The Win" : "The Protection"}
            </span>
          </div>
          <h3 className="text-3xl lg:text-5xl font-bold tracking-tighter italic serif leading-tight">
            {title}
          </h3>
          <p className={cn(
            "text-sm lg:text-lg leading-relaxed max-w-md",
            isWin ? "text-black/70" : "opacity-50"
          )}>
            {description}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest">Execute Now</span>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border group-hover:translate-x-2 transition-transform",
            isWin ? "border-black/20 bg-black/10" : "border-white/20 bg-white/5"
          )}>
            <ArrowRight size={20} />
          </div>
        </div>
      </div>

      {/* Background Accents */}
      {isWin && (
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp size={120} />
        </div>
      )}
      {!isWin && (
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={120} />
        </div>
      )}
    </motion.button>
  );
}

export function SmartActions() {
  const [pivotMessage, setPivotMessage] = useState<string | null>(null);

  const logAdvice = async (type: string, content: string) => {
    try {
      const response = await fetch('/api/log-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          adviceType: type,
          adviceContent: content
        })
      });
      const data = await response.json();
      if (data.shouldPivot) {
        setPivotMessage(data.pivotMessage);
      }
    } catch (error) {
      console.error('Failed to log advice:', error);
    }
  };

  const handleExecute = async (type: string, action: () => void) => {
    action();
    try {
      await fetch('/api/follow-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          adviceType: type
        })
      });
    } catch (error) {
      console.error('Failed to mark advice as followed:', error);
    }
  };

  useEffect(() => {
    logAdvice('PREPAY_LOAN', 'Save ₹4,500: Prepay ICICI today.');
    logAdvice('INSURANCE_GAP', 'Fix your ₹40L Insurance Gap.');
  }, []);

  return (
    <div className="space-y-8">
      {pivotMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-sm flex items-center gap-3 text-purple-300"
        >
          <Sparkles className="text-purple-500" size={18} />
          <p className="text-xs font-medium italic">{pivotMessage}</p>
        </motion.div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ActionCard 
          type="WIN"
          title="Save ₹4,500: Prepay ICICI today."
          description="By moving ₹4,500 from your idle savings to your ICICI Personal Loan, you shave 2 days off your work life."
          onClick={() => handleExecute('PREPAY_LOAN', () => alert("Executing ICICI Prepayment Strategy..."))}
        />
        <ActionCard 
          type="PROTECTION"
          title="Fix your ₹40L Insurance Gap."
          description="Your current Term Insurance doesn't cover your Home Loan. A ₹40L top-up ensures your family keeps the house."
          onClick={() => handleExecute('INSURANCE_GAP', () => alert("Opening Insurance Gap Analysis..."))}
        />
      </div>
    </div>
  );
}
