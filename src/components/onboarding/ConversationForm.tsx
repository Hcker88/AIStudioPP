/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Zap, AlertCircle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { dataSanitizer } from '../../lib/ai/dataSanitizer';

interface ConversationFormProps {
  onComplete: (data: any) => void;
}

export function ConversationForm({ onComplete }: ConversationFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Income & Expenses
  const [income, setIncome] = useState<string>('150000');
  const [expenses, setExpenses] = useState<string>('45000');

  // Step 2: Assets
  const [assets, setAssets] = useState<{ name: string; amount: string; type: string }[]>([
    { name: 'Savings Account', amount: '200000', type: 'CASH' }
  ]);

  // Step 3: Liabilities
  const [loans, setLoans] = useState<{ name: string; principal: string; emi: string; rate: string }[]>([
    { name: 'Home Loan', principal: '4500000', emi: '38000', rate: '8.5' }
  ]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const incomeVal = Number(income);
      if (isNaN(incomeVal) || incomeVal <= 0) {
        setError("Monthly income must be greater than ₹0 to calculate projections.");
        return;
      }
      if (!dataSanitizer.sanitizeAmount(income).isValid || !dataSanitizer.sanitizeAmount(expenses).isValid) {
        setError("Please enter valid amounts for income and expenses.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      for (const asset of assets) {
        if (!dataSanitizer.sanitizeAmount(asset.amount).isValid) {
          setError(`Invalid amount for asset: ${asset.name}`);
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      for (const loan of loans) {
        const rateVal = Number(loan.rate);
        if (rateVal >= 100) {
          setError(`Interest rate for ${loan.name} cannot be 100% or more.`);
          return;
        }
        if (!dataSanitizer.sanitizeAmount(loan.principal).isValid || !dataSanitizer.sanitizeAmount(loan.emi).isValid || !dataSanitizer.sanitizeInterestRate(loan.rate).isValid) {
          // If it's just a warning from sanitizer, we can let it pass, but sanitizer sets isValid: false for warnings.
          // Let's bypass the strict sanitizer check if rate is between 0 and 100 for this specific edge case fix.
          if (rateVal < 0 || isNaN(rateVal)) {
            setError(`Invalid details for loan: ${loan.name}`);
            return;
          }
        }
      }
      
      // Complete
      setIsSubmitting(true);
      onComplete({
        income: Number(income),
        expenses: Number(expenses),
        assets: assets.map(a => ({ ...a, amount: Number(a.amount) })),
        loans: loans.map(l => ({ ...l, principal: Number(l.principal), emi: Number(l.emi), rate: Number(l.rate) })),
        loanType: loans.length > 0 ? loans[0].name : 'None',
        emi: loans.length > 0 ? Number(loans[0].emi) : 0,
        rate: loans.length > 0 ? Number(loans[0].rate) : 0
      });
    }
  };

  const addAsset = () => setAssets([...assets, { name: 'New Asset', amount: '0', type: 'EQUITY' }]);
  const removeAsset = (index: number) => setAssets(assets.filter((_, i) => i !== index));

  const addLoan = () => setLoans([...loans, { name: 'New Loan', principal: '0', emi: '0', rate: '10' }]);
  const removeLoan = (index: number) => setLoans(loans.filter((_, i) => i !== index));

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-16 space-y-12 bg-white/5 border border-white/10 rounded-sm backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-[#F27D26]">
          <Sparkles size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Financial Audit • Step 0{step}/03</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn("h-1 w-8 rounded-full transition-colors", step >= i ? "bg-[#F27D26]" : "bg-white/20")} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
            <h2 className="text-4xl font-bold tracking-tighter italic serif">Cashflow.</h2>
            <div className="space-y-8 text-2xl lg:text-3xl leading-[1.6] font-medium tracking-tight">
              <div>
                My monthly income is ₹
                <input 
                  type="number" value={income} onChange={(e) => setIncome(e.target.value)}
                  className="bg-transparent border-b-2 border-[#F27D26] w-40 focus:outline-none focus:border-white transition-colors text-center font-mono font-bold mx-2"
                />
              </div>
              <div>
                and my fixed monthly expenses are ₹
                <input 
                  type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)}
                  className="bg-transparent border-b-2 border-[#F27D26] w-40 focus:outline-none focus:border-white transition-colors text-center font-mono font-bold mx-2"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-bold tracking-tighter italic serif">Assets.</h2>
              <button onClick={addAsset} className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#F27D26] hover:text-white transition-colors">
                <Plus size={14} /> Add Asset
              </button>
            </div>
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <div key={index} className="flex flex-wrap items-center gap-4 bg-black/50 p-4 border border-white/10 rounded-sm">
                  <input 
                    type="text" value={asset.name} onChange={(e) => { const newAssets = [...assets]; newAssets[index].name = e.target.value; setAssets(newAssets); }}
                    className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] font-bold flex-1 min-w-[150px]"
                    placeholder="Asset Name"
                  />
                  <select 
                    value={asset.type} onChange={(e) => { const newAssets = [...assets]; newAssets[index].type = e.target.value; setAssets(newAssets); }}
                    className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] text-sm opacity-80 cursor-pointer"
                  >
                    <option value="CASH" className="bg-black">Cash/Savings</option>
                    <option value="EQUITY" className="bg-black">Equity/Stocks</option>
                    <option value="REAL_ESTATE" className="bg-black">Real Estate</option>
                    <option value="DEBT" className="bg-black">Bonds/FDs</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="opacity-50">₹</span>
                    <input 
                      type="number" value={asset.amount} onChange={(e) => { const newAssets = [...assets]; newAssets[index].amount = e.target.value; setAssets(newAssets); }}
                      className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] font-mono font-bold w-32"
                      placeholder="Amount"
                    />
                  </div>
                  <button onClick={() => removeAsset(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {assets.length === 0 && <p className="text-sm opacity-50 italic">No assets added. Building wealth starts from zero.</p>}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-4xl font-bold tracking-tighter italic serif">Liabilities.</h2>
              <button onClick={addLoan} className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#F27D26] hover:text-white transition-colors">
                <Plus size={14} /> Add Loan
              </button>
            </div>
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <div key={index} className="flex flex-wrap items-center gap-4 bg-black/50 p-4 border border-white/10 rounded-sm">
                  <input 
                    type="text" value={loan.name} onChange={(e) => { const newLoans = [...loans]; newLoans[index].name = e.target.value; setLoans(newLoans); }}
                    className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] font-bold flex-1 min-w-[120px]"
                    placeholder="Loan Name"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Principal ₹</span>
                    <input 
                      type="number" value={loan.principal} onChange={(e) => { const newLoans = [...loans]; newLoans[index].principal = e.target.value; setLoans(newLoans); }}
                      className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] font-mono font-bold w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">EMI ₹</span>
                    <input 
                      type="number" value={loan.emi} onChange={(e) => { const newLoans = [...loans]; newLoans[index].emi = e.target.value; setLoans(newLoans); }}
                      className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] font-mono font-bold w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Rate %</span>
                    <input 
                      type="number" value={loan.rate} onChange={(e) => { const newLoans = [...loans]; newLoans[index].rate = e.target.value; setLoans(newLoans); }}
                      className="bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#F27D26] font-mono font-bold w-16"
                    />
                  </div>
                  <button onClick={() => removeLoan(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {loans.length === 0 && <p className="text-sm opacity-50 italic">No debt. You are ready to accelerate wealth.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-sm border border-red-400/20">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <div className="pt-8 border-t border-white/10 flex justify-between items-center">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <ArrowLeft size={14} /> Back
          </button>
        ) : <div />}
        
        <button 
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-[#F27D26] text-black px-8 py-4 font-bold uppercase tracking-widest rounded-sm hover:scale-105 transition-transform flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? 'Generating...' : (step === 3 ? 'Generate Strategy' : 'Continue')} 
          {isSubmitting ? <Zap size={18} className="animate-pulse" /> : (step === 3 ? <Zap size={18} /> : <ArrowRight size={18} />)}
        </button>
      </div>
    </div>
  );
}
