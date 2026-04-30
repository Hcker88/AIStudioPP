/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Zap, AlertCircle, ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { dataSanitizer } from '../../lib/ai/dataSanitizer';

interface ConversationFormProps {
  onComplete: (data: any) => void;
}

export function ConversationForm({ onComplete }: ConversationFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [incomes, setIncomes] = useState<{ source: string; amount: string }[]>([
    { source: 'Primary Salary', amount: '150000' }
  ]);
  const [expenses, setExpenses] = useState<{ category: string; amount: string; isFixed: boolean }[]>([
    { category: 'Housing & Utilities', amount: '45000', isFixed: true }
  ]);

  // Step 2: Assets
  const [assets, setAssets] = useState<{ name: string; amount: string; type: string }[]>([
    { name: 'Savings Account', amount: '200000', type: 'CASH' }
  ]);

  // Step 3: Liabilities
  const [loans, setLoans] = useState<{ name: string; principal: string; emi: string; rate: string }[]>([
    { name: 'Home Loan', principal: '4500000', emi: '38000', rate: '8.5' }
  ]);

  const [isParsing, setIsParsing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    try {
      const text = await file.text();
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Analysis failed.');
      
      const resData = await response.json();
      if (resData.success && resData.data) {
        if (resData.data.incomes && resData.data.incomes.length > 0) setIncomes(resData.data.incomes);
        if (resData.data.expenses && resData.data.expenses.length > 0) setExpenses(resData.data.expenses);
        if (resData.data.assets && resData.data.assets.length > 0) setAssets(resData.data.assets);
        if (resData.data.loans && resData.data.loans.length > 0) setLoans(resData.data.loans);
      } else {
        throw new Error('Unable to parse document format.');
      }
    } catch (err) {
      console.error(err);
      setError('Import failed. Please try adding manually.');
    } finally {
      setIsParsing(false);
      // reset file input
      e.target.value = '';
    }
  };

  const applySanitizedAmounts = (items: any[], type: 'incomes' | 'expenses' | 'assets') => {
    let hasError = false;
    let errorMessage = '';
    const correctedItems = items.map(item => {
      const res = dataSanitizer.sanitizeAmount(item.amount);
      if (res.type === 'ERROR') {
        hasError = true;
        errorMessage = res.message || 'Invalid amount.';
      } else if (res.type === 'CORRECTION' && res.correctedValue !== undefined) {
        return { ...item, amount: res.correctedValue.toString() };
      }
      return item;
    });
    return { hasError, errorMessage, correctedItems };
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const { hasError: incErr, errorMessage: incMsg, correctedItems: nextIncomes } = applySanitizedAmounts(incomes, 'incomes');
      if (incErr) { setError(incMsg); return; }
      
      const { hasError: expErr, errorMessage: expMsg, correctedItems: nextExpenses } = applySanitizedAmounts(expenses, 'expenses');
      if (expErr) { setError(expMsg); return; }

      setIncomes(nextIncomes);
      setExpenses(nextExpenses);

      const incomeVal = nextIncomes.reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      if (isNaN(incomeVal) || incomeVal <= 0) {
        setError("Total monthly income must be greater than ₹0 to calculate projections.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const { hasError: astErr, errorMessage: astMsg, correctedItems: nextAssets } = applySanitizedAmounts(assets, 'assets');
      if (astErr) { setError(astMsg); return; }
      setAssets(nextAssets);
      setStep(3);
    } else if (step === 3) {
      const nextLoans = [...loans];
      for (const [index, loan] of loans.entries()) {
        const prinRes = dataSanitizer.sanitizeAmount(loan.principal);
        if (prinRes.type === 'ERROR') { setError(`Invalid principal for ${loan.name}`); return; }
        if (prinRes.correctedValue !== undefined) nextLoans[index].principal = prinRes.correctedValue.toString();

        const emiRes = dataSanitizer.sanitizeAmount(loan.emi);
        if (emiRes.type === 'ERROR') { setError(`Invalid EMI for ${loan.name}`); return; }
        if (emiRes.correctedValue !== undefined) nextLoans[index].emi = emiRes.correctedValue.toString();

        const rateRes = dataSanitizer.sanitizeInterestRate(loan.rate);
        if (rateRes.type === 'ERROR') { setError(rateRes.message || `Invalid rate for ${loan.name}`); return; }
        if (rateRes.correctedValue !== undefined) nextLoans[index].rate = rateRes.correctedValue.toString();
      }
      setLoans(nextLoans);
      
      // Complete
      setIsSubmitting(true);
      onComplete({
        income: incomes.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0),
        expenses: expenses.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0),
        detailedExpenses: expenses.map((e: any) => ({ category: e.category, amount: Number(e.amount), isFixed: e.isFixed })),
        detailedIncomes: incomes.map((i: any) => ({ source: i.source, amount: Number(i.amount) })),
        assets: assets.map((a: any) => ({ ...a, amount: Number(a.amount) })),
        loans: nextLoans.map((l: any) => ({ ...l, principal: Number(l.principal), emi: Number(l.emi), rate: Number(l.rate) })),
        loanType: nextLoans.length > 0 ? nextLoans[0].name : 'None',
        emi: nextLoans.length > 0 ? Number(nextLoans[0].emi) : 0,
        rate: nextLoans.length > 0 ? Number(nextLoans[0].rate) : 0
      });
    }
  };

  const addAsset = () => setAssets([...assets, { name: 'New Asset', amount: '0', type: 'EQUITY' }]);
  const removeAsset = (index: number) => setAssets(assets.filter((_, i) => i !== index));

  const addLoan = () => setLoans([...loans, { name: 'New Loan', principal: '0', emi: '0', rate: '10' }]);
  const removeLoan = (index: number) => setLoans(loans.filter((_, i) => i !== index));

  const addIncome = () => setIncomes([...incomes, { source: 'New Income', amount: '0' }]);
  const removeIncome = (index: number) => setIncomes(incomes.filter((_, i) => i !== index));

  const addExpense = () => setExpenses([...expenses, { category: 'New Expense', amount: '0', isFixed: true }]);
  const removeExpense = (index: number) => setExpenses(expenses.filter((_, i) => i !== index));

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-16 space-y-12 bg-white/5 border border-white/10 rounded-sm backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-[#F27D26]">
          <Sparkles size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Financial Audit • Step 0{step}/03</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleFileUpload}
              disabled={isParsing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            />
            <button disabled={isParsing} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#F27D26] hover:text-white transition-colors bg-[#F27D26]/10 px-3 py-1.5 rounded-sm border border-[#F27D26]/20 group-hover:border-[#F27D26]/50">
              {isParsing ? <Zap size={14} className="animate-pulse" /> : <FileText size={14} />}
              {isParsing ? 'Analyzing...' : 'Auto-Import CSV'}
            </button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn("h-1 w-8 rounded-full transition-colors", step >= i ? "bg-[#F27D26]" : "bg-white/20")} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
            <h2 className="text-4xl font-bold tracking-tighter italic serif">Cashflow.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Sector 1: Income */}
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold tracking-tight text-[#F27D26]">Income Sources</h3>
                  <button onClick={addIncome} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors opacity-70">
                    <Plus size={12} /> Add Income
                  </button>
                </div>
                <div className="space-y-4">
                  {incomes.map((inc, index) => (
                    <div key={`income-${index}`} className="flex items-center gap-4 bg-black/30 p-3 rounded-sm border border-white/5">
                      <input 
                        type="text" value={inc.source} onChange={(e) => { const n = [...incomes]; n[index].source = e.target.value; setIncomes(n); }}
                        className="bg-transparent border-b border-white/10 focus:border-[#F27D26] pb-1 w-full flex-1 focus:outline-none text-sm font-medium"
                        placeholder="Income Source"
                      />
                      <div className="flex items-center gap-1 text-[#F27D26]">
                        <span>₹</span>
                        <input 
                          type="number" value={inc.amount} onChange={(e) => { const n = [...incomes]; n[index].amount = e.target.value; setIncomes(n); }}
                          className="bg-transparent border-b border-white/10 focus:border-[#F27D26] pb-1 w-24 focus:outline-none font-mono text-sm text-white"
                          placeholder="Amount"
                        />
                      </div>
                      {incomes.length > 1 && (
                        <button onClick={() => removeIncome(index)} className="text-red-400 opacity-50 hover:opacity-100 p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="text-right text-xs uppercase tracking-widest opacity-50 pt-2">
                    Total Income: <span className="font-bold text-white text-sm">₹{incomes.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Sector 2: Expenses */}
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold tracking-tight text-[#F27D26]">Monthly Expenses</h3>
                  <button onClick={addExpense} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors opacity-70">
                    <Plus size={12} /> Add Expense
                  </button>
                </div>
                <div className="space-y-4">
                  {expenses.map((exp, index) => (
                    <div key={`expense-${index}`} className="flex items-center gap-4 bg-black/30 p-3 rounded-sm border border-white/5">
                      <input 
                        type="text" value={exp.category} onChange={(e) => { const n = [...expenses]; n[index].category = e.target.value; setExpenses(n); }}
                        className="bg-transparent border-b border-white/10 focus:border-[#F27D26] pb-1 w-full flex-1 focus:outline-none text-sm font-medium"
                        placeholder="Expense Category"
                      />
                      <div className="flex items-center gap-1 text-red-400">
                        <span>₹</span>
                        <input 
                          type="number" value={exp.amount} onChange={(e) => { const n = [...expenses]; n[index].amount = e.target.value; setExpenses(n); }}
                          className="bg-transparent border-b border-white/10 focus:border-red-400 pb-1 w-24 focus:outline-none font-mono text-sm text-white"
                          placeholder="Amount"
                        />
                      </div>
                      {expenses.length > 1 && (
                        <button onClick={() => removeExpense(index)} className="text-red-400 opacity-50 hover:opacity-100 p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="text-right text-xs uppercase tracking-widest opacity-50 pt-2">
                    Total Expenses: <span className="font-bold text-white text-sm">₹{expenses.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
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
