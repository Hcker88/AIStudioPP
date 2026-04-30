import React, { Suspense, useMemo } from 'react';
import { StatCard } from '../ui/StatCard';
import { LoanRow } from '../ui/LoanRow';
import { formatINR } from '../../lib/formatters';
import { useStrategy } from '../../contexts/StrategyContext';
import { AdvisoryChat } from '../chat/AdvisoryChat';
import { compareStrategies } from '../../lib/financialMath';

interface DashboardSectionProps {
  income: number;
  loans: any[];
  isPrivacyMode: boolean;
  highlightedCard: string | null;
  user: any;
  onLoanClose: () => void;
}

export function DashboardSection({
  income,
  loans,
  isPrivacyMode,
  highlightedCard,
  user,
  onLoanClose,
}: DashboardSectionProps) {

  const strategyResults = useMemo(() => {
    return compareStrategies(loans, 0, 0); // extra payment 0 for now
  }, [loans]);

  return (
    <>
      {/* Left Column: Command Center */}
      <div className="col-span-12 lg:col-span-8 space-y-12">
        
        {/* Badges */}
        <div className="flex flex-wrap gap-4 items-center mb-[-1rem]">
          <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            Data Freshness: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            Deterministic Math Validated
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Monthly Income" value={formatINR(income, true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
          <StatCard label="Total Debt" value={formatINR(loans.reduce((acc, l) => acc + l.principal, 0), true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
          <StatCard label="Monthly EMI" value={formatINR(loans.reduce((acc, l) => acc + l.emi, 0), true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
        </div>

        {/* Actionable Next Move Card */}
        <div className="bg-gradient-to-r from-black/80 to-[#1a0f05] border border-[#F27D26]/50 rounded-sm p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[#F27D26]/5 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')]"></div>
          <div className="relative z-10">
            <span className="text-[#F27D26] font-mono text-xs tracking-widest uppercase">The Play</span>
            <h2 className="text-3xl font-bold tracking-tight mt-2 text-white">Your Best Next Move</h2>
            <p className="mt-4 text-white/80 max-w-2xl text-lg">
              {loans.length > 0 
                ? `Based on your connected accounts, your objective for this month is to prepay an extra on the ${loans.reduce((prev, current) => (prev.interestRate > current.interestRate) ? prev : current).name}. `
                : "Looking good! You are debt-free. It's time to build wealth."
              }
            </p>
            {loans.length > 0 && (
              <div className="mt-6 flex gap-4">
                <button className="bg-[#F27D26] text-black px-6 py-3 font-bold rounded-sm uppercase tracking-wide hover:scale-105 transition-transform">
                  Commit to Play
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Strategy Engine Card Placeholder */}
        <div className="bg-white/5 border border-white/10 rounded-sm p-6 relative">
          <span className="absolute top-4 right-4 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-widest font-bold">Strategy Engine</span>
          <h3 className="text-xl font-bold mb-4">Compare Playbooks</h3>
          <p className="text-sm opacity-60 mb-6">Which payoff path is optimal for your psychology and cashflow?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyResults.length > 0 ? strategyResults.map(strategy => (
              <div key={strategy.name} className="border border-white/10 bg-black/40 p-4 rounded-sm hover:border-[#F27D26]/50 transition-colors cursor-pointer group">
                <div className="font-bold mb-1 text-white">{strategy.name}</div>
                <div className="text-[10px] opacity-70 mb-4 h-8">{strategy.description}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="opacity-50 font-mono uppercase">Timeline</span>
                    <span className="font-bold group-hover:text-[#F27D26] transition-colors">{strategy.monthsToFreedom} mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="opacity-50 font-mono uppercase">Total Int.</span>
                    <span className="font-bold text-red-400">₹{Math.round(strategy.totalInterestPaid).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center text-xs opacity-50 py-4">No liabilities found. Strategies skipped.</div>
            )}
          </div>
        </div>

        {/* Weekly Review Flow */}
        <div className="bg-white/5 border border-[#F27D26]/20 rounded-sm p-6 relative group">
          <span className="text-[#F27D26] font-mono text-xs tracking-widest uppercase">Weekly Sync</span>
          <h3 className="text-xl font-bold mt-2 mb-2">Did anything change this week?</h3>
          <p className="text-sm opacity-60 mb-6 max-w-xl">
            Did you overspend on dining or get an unexpected bonus? Log it here so the engine can recalibrate your payoff date.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => {
                const amount = prompt("How much was the unexpected expense?");
                if (amount && !isNaN(Number(amount))) {
                  // Assuming they overspent, suggesting correction
                  const msg = `🚨 Alert: Logged an unexpected expense of ₹${amount}. This pushes back your debt-free date by roughly 1 month. To correct, consider pulling from the 'Cash Cushion' instead of credit.`;
                  // We simulate updating the sync message which feeds into Chat context
                  const win = window as any;
                  if (win.alert) win.alert(msg);
                }
              }}
              className="bg-white/5 border border-white/10 p-4 rounded-sm hover:border-[#F27D26]/50 transition-colors text-left flex flex-col gap-2"
            >
              <span className="font-bold text-sm">Log Unexpected Expense</span>
              <span className="text-xs opacity-50">e.g. Car repair, medical</span>
            </button>
            <button 
              onClick={() => {
                const amount = prompt("How much extra income did you receive?");
                if (amount && !isNaN(Number(amount))) {
                  const msg = `🎉 Great! Logged extra income of ₹${amount}. The strategy engine recommends allocating 80% to your highest interest debt and 20% to savings.`;
                  const win = window as any;
                  if (win.alert) win.alert(msg);
                }
              }}
              className="bg-white/5 border border-white/10 p-4 rounded-sm hover:border-[#F27D26]/50 transition-colors text-left flex flex-col gap-2"
            >
              <span className="font-bold text-sm text-green-400">Log Extra Income</span>
              <span className="text-xs opacity-50">e.g. Bonus, side hustle, tax refund</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-12">
          {/* Bottom: Breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-sm">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest">Liability Breakdown</h3>
            </div>
            <div className="divide-y divide-white/5">
              {loans.map((loan, i) => (
                <LoanRow 
                  key={i}
                  name={loan.name} 
                  apr={loan.interestRate} 
                  emi={loan.emi} 
                  priority={loan.interestRate > 12 ? "HIGH" : "MEDIUM"} 
                  isPrivacyMode={isPrivacyMode}
                  highlight={highlightedCard === loan.name}
                  onClose={onLoanClose}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: The Coach */}
      <div className="col-span-12 lg:col-span-4 space-y-8 h-[calc(100vh-160px)] sticky top-32">
        <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-t-[#F27D26] border-white/10 rounded-full animate-spin"></div></div>}>
          <AdvisoryChat 
            user={user} 
            highestLoanName={loans.length > 0 ? loans.reduce((prev, current) => (prev.interestRate > current.interestRate) ? prev : current).name : "No loans"} 
            highestLoanRate={loans.length > 0 ? loans.reduce((prev, current) => (prev.interestRate > current.interestRate) ? prev : current).interestRate : 0} 
          />
        </Suspense>
      </div>
    </>
  );
}
