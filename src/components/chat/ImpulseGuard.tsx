/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface ImpulseGuardProps {
  onClose: () => void;
  onNudge: (message: string) => void;
}

/**
 * Impulse Purchase Calculator
 * Calculates the "Opportunity Cost" of a purchase over 10 years.
 */
export function ImpulseGuard({ onClose, onNudge }: ImpulseGuardProps) {
  const [itemName, setItemName] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [isEmi, setIsEmi] = useState(false);

  const calculateOpportunityCost = () => {
    if (cost <= 0) return;

    // 1. Future Wealth Calculation (10 years at 12% ROI)
    const years = 10;
    const roi = 0.12;
    const futureWealth = cost * Math.pow(1 + roi, years);
    
    // 2. Debt Impact (Assuming 10% avg debt interest)
    const debtInterest = 0.10;
    const debtImpact = cost * Math.pow(1 + debtInterest, years);

    const nudgeMessage = `I'm considering buying ${itemName || 'this item'} for ${formatINR(cost)}. 
      This ${itemName || 'item'} actually costs you ${formatINR(futureWealth)} in 'Future Wealth' (at 12% ROI over 10 years) 
      and delays your debt closure by approximately ${Math.round(cost / 15000)} months. Still want to proceed?`;

    onNudge(nudgeMessage);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 border border-white/10 p-6 rounded-sm space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Shield className="text-[#F27D26]" size={20} />
        <h3 className="text-xs font-bold uppercase tracking-widest">Impulse Guard</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest opacity-40">Item Name</label>
          <input 
            type="text" 
            placeholder="e.g., iPhone 16 Pro"
            className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-[#F27D26] outline-none transition-all"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest opacity-40">Cost (₹)</label>
          <input 
            type="number" 
            placeholder="1,20,000"
            className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-[#F27D26] outline-none transition-all"
            value={cost || ''}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isEmi"
            checked={isEmi}
            onChange={(e) => setIsEmi(e.target.checked)}
            className="accent-[#F27D26]"
          />
          <label htmlFor="isEmi" className="text-[10px] uppercase tracking-widest opacity-40">No-Cost EMI?</label>
        </div>
      </div>

      <div className="bg-[#F27D26]/10 border border-[#F27D26]/20 p-4 rounded-sm flex gap-3">
        <AlertCircle className="text-[#F27D26] shrink-0" size={16} />
        <p className="text-[10px] leading-relaxed opacity-60 italic">
          "Every Rupee spent today is a Rupee that cannot fight your debt tomorrow."
        </p>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onClose}
          className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={calculateOpportunityCost}
          className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-[#F27D26] text-black hover:scale-[1.02] transition-all"
        >
          Calculate Cost
        </button>
      </div>
    </motion.div>
  );
}
