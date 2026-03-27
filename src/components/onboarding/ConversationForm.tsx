/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { dataSanitizer } from '../../lib/ai/dataSanitizer';

interface ConversationFormProps {
  onComplete: (data: any) => void;
}

export function ConversationForm({ onComplete }: ConversationFormProps) {
  const [income, setIncome] = useState<string>('150000');
  const [emi, setEmi] = useState<string>('38000');
  const [loanType, setLoanType] = useState<string>('Home');
  const [rate, setRate] = useState<string>('8.5');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Sanitize data
    const incomeCheck = dataSanitizer.sanitizeAmount(income);
    if (!incomeCheck.isValid) {
      setError(incomeCheck.message || "Invalid income");
      return;
    }

    if (loanType !== 'None') {
      const emiCheck = dataSanitizer.sanitizeAmount(emi);
      const rateCheck = dataSanitizer.sanitizeInterestRate(rate);

      if (!emiCheck.isValid) {
        setError(emiCheck.message || "Invalid EMI");
        return;
      }
      if (!rateCheck.isValid) {
        setError(rateCheck.message || "Invalid rate");
        return;
      }
    }

    onComplete({
      income: Number(income),
      emi: loanType === 'None' ? 0 : Number(emi),
      loanType,
      rate: loanType === 'None' ? 0 : Number(rate)
    });
  };

  const isNoDebt = loanType === 'None';

  return (
    <div className="max-w-4xl mx-auto p-12 lg:p-24 space-y-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 text-[#F27D26]">
          <Sparkles size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">The Interrogation</span>
        </div>
        <h2 className="text-4xl lg:text-6xl font-bold tracking-tighter italic serif leading-none">
          Let's map your <br />
          <span className="opacity-30">{isNoDebt ? 'Wealth Velocity.' : 'Financial Pulse.'}</span>
        </h2>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl lg:text-4xl leading-[1.6] font-medium tracking-tight"
      >
        I earn ₹
        <input 
          type="number" 
          value={income}
          onChange={(e) => {
            setIncome(e.target.value);
            setError(null);
          }}
          className="bg-transparent border-b-2 border-[#F27D26] w-32 focus:outline-none focus:border-white transition-colors text-center font-mono font-bold"
        />
        per month, and I 
        <select 
          value={loanType}
          onChange={(e) => {
            setLoanType(e.target.value);
            setError(null);
          }}
          className="bg-transparent border-b-2 border-[#F27D26] focus:outline-none focus:border-white transition-colors text-center font-bold cursor-pointer mx-2"
        >
          <option value="Home" className="bg-black">am paying towards a Home</option>
          <option value="Car" className="bg-black">am paying towards a Car</option>
          <option value="Personal" className="bg-black">am paying towards a Personal</option>
          <option value="Credit Card" className="bg-black">am paying towards a Credit Card</option>
          <option value="None" className="bg-black">have NO debt and want to build</option>
        </select>
        {isNoDebt ? 'wealth.' : 'loan.'}

        {!isNoDebt && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {" "}My EMI is ₹
            <input 
              type="number" 
              value={emi}
              onChange={(e) => {
                setEmi(e.target.value);
                setError(null);
              }}
              className="bg-transparent border-b-2 border-[#F27D26] w-32 focus:outline-none focus:border-white transition-colors text-center font-mono font-bold"
            />
            at 
            <input 
              type="number" 
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                setError(null);
              }}
              className="bg-transparent border-b-2 border-[#F27D26] w-20 focus:outline-none focus:border-white transition-colors text-center font-mono font-bold"
            />
            % interest.
          </motion.span>
        )}
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-sm border border-red-400/20"
        >
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-12"
      >
        <button 
          onClick={handleSubmit}
          className="group bg-[#F27D26] text-black px-12 py-6 font-bold text-xl rounded-sm hover:scale-105 transition-transform flex items-center gap-4"
        >
          {isNoDebt ? 'START WEALTH BUILDING' : 'ANALYZE MY STRATEGY'} <Zap size={24} className="group-hover:animate-pulse" />
        </button>
        <p className="text-[10px] uppercase tracking-widest opacity-40 mt-6 max-w-sm leading-relaxed">
          Your data is protected by the Zero-Knowledge Proxy. Even the AI never sees your real identity.
        </p>
      </motion.div>
    </div>
  );
}
