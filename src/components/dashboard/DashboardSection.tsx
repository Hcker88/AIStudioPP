import React, { Suspense, useMemo } from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { LoanRow } from '../ui/LoanRow';
import { formatINR } from '../../lib/formatters';
import { AdvisoryChat } from '../chat/AdvisoryChat';
import { InsightsList } from './InsightsList';
import { PortfolioCard } from './PortfolioCard';
import { GoalsCard } from './GoalsCard';
import { useFinance } from '../../contexts/FinanceContext';
import { getNextBestAction } from '../../lib/advisor';
import { UserProfileSchema } from '../../lib/types';

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
  const { profile } = useFinance();

  const strategyResults: any[] = []; // removed financialMath compareStrategies

  const metrics = {
    netWorth: profile?.metrics?.netWorth || 0,
    monthlyCashFlow: (profile?.income || 0) - (profile?.expenses || 0) - (loans.reduce((acc, l) => acc + l.monthlyEmi, 0)),
    savingsRate: profile?.metrics?.savingsRate || 0,
    debtToIncomeRatio: profile?.metrics?.debtRatio || 0,
    financialHealthScore: profile?.metrics?.financialHealthScore || 50
  };

  const mappedInsights = profile?.insights?.map((text, i) => ({
    id: `insight_${i}`,
    userId: user?.id,
    content: text,
    priority: text.toLowerCase().includes('critical') || text.toLowerCase().includes('priority') ? 'CRITICAL' : 'HIGH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })) || [];

  const mappedHoldings = profile?.assets?.stocks?.map(s => ({
    userId: user?.id,
    symbol: s.name,
    assetName: s.name,
    assetType: 'EQUITY',
    quantity: s.quantity,
    buyPrice: s.buyPrice,
    currentPrice: s.currentPrice || s.buyPrice,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })) || [];

  const mappedGoals = profile?.goals?.map(g => ({
    userId: user?.id,
    name: g.text,
    targetAmount: 0,
    currentSavings: 0,
    targetDate: new Date(g.createdAt + 31536000000).toISOString(), // 1 year
    createdAt: new Date(g.createdAt).toISOString(),
    updatedAt: new Date(g.createdAt).toISOString()
  })) || [];

  return (
    <>
      {/* Left Column: Command Center */}
      <div className="col-span-12 lg:col-span-8 space-y-14">
        
        {/* Badges */}
        <div className="flex flex-wrap gap-4 items-center mb-[-1rem]">
          <div className="px-3 py-1.5 bg-[#18181f] border border-white/8 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E8C547]"></div>
            Data Freshness: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            AI Synchronized
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Net Worth" value={formatINR(metrics.netWorth, true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
          <StatCard label="Monthly Income" value={formatINR(income, true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
          <StatCard label="Monthly Cash Flow" value={formatINR(metrics.monthlyCashFlow, true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} trend={metrics.monthlyCashFlow > 0 ? "up" : "down"} />
          <div className="bg-[#18181f] border border-white/8 rounded-xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#F27D26]/10 to-transparent"></div>
            <Activity className="w-6 h-6 text-[#F27D26] mb-2 z-10" />
            <div className="text-3xl font-bold font-mono text-white z-10">{metrics.financialHealthScore}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 z-10 mt-1">Health Score</div>
          </div>
        </div>

        {mappedInsights.length > 0 && (
          <InsightsList insights={mappedInsights as any} />
        )}

        <PortfolioCard holdings={mappedHoldings as any} isPrivacyMode={isPrivacyMode} />
        
        <GoalsCard goals={mappedGoals as any} isPrivacyMode={isPrivacyMode} />

        {/* Actionable Next Move Card */}
        <div className="bg-[#1f1f28] border border-[#F27D26]/30 rounded-sm p-6 shadow-[0_0_30px_rgba(242,125,38,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] to-[#0d0d12]"></div>
          <div className="relative z-10">
            <span className="text-[#F27D26] font-mono text-xs tracking-widest uppercase flex items-center gap-2">
              <Sparkles size={14} className="text-[#F27D26]" />
              The Play
            </span>
            <h2 className="text-3xl font-bold tracking-tight mt-2 text-white">Your Best Next Move</h2>
            <p className="mt-4 text-white/80 max-w-2xl text-lg font-light">
              {profile ? getNextBestAction(profile) : "Looking good! You are debt-free. It's time to build wealth."}
            </p>
            {loans.length > 0 && (
              <div className="mt-6 flex gap-4">
                <button className="bg-[#F27D26] text-black px-6 py-3 font-bold rounded-lg shadow-lg shadow-orange-500/20 hover:bg-[#FF8C35] transition-all flex items-center gap-2">
                  Commit to Play
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-14">
          {/* Bottom: Breakdown */}
          <div className="bg-[#18181f] border border-white/8 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/8 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest">Liability Breakdown</h3>
            </div>
            <div className="divide-y divide-white/5">
              {loans.map((loan, i) => (
                <LoanRow 
                  key={i}
                  name={loan.name} 
                  apr={loan.interestRate} 
                  emi={loan.monthlyEmi} 
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
          <AdvisoryChat />
        </Suspense>
      </div>
    </>
  );
}

