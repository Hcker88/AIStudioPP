import React, { Suspense } from 'react';
import { motion } from 'motion/react';
import { ConversationForm } from '../onboarding/ConversationForm';
import { useFinance } from '../../contexts/FinanceContext';
import { fetchUserProfile, saveUserProfile } from '../../lib/profileDb';
import { calculateNetWorth, calculateSavingsRate, calculateDebtRatio, calculateFHS } from '../../lib/finance';
import { generateInsights } from '../../lib/insights';

interface OnboardingSectionProps {
  onComplete: () => void;
}

export function OnboardingSection({
  onComplete
}: OnboardingSectionProps) {
  const { user, refreshProfile } = useFinance();

  return (
    <>
      <div className="mb-16 text-center">
        <span className="text-[#F27D26] font-mono text-sm tracking-widest uppercase">Phase 01: Liabilities</span>
        <h2 className="text-5xl font-bold tracking-tight mt-4 italic serif">The Interrogation.</h2>
        <p className="opacity-80 mt-4 text-lg">Your financial data is private, securely stored, and never shared. It is only used to help you manage your wealth.</p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-t-[#F27D26] border-white/10 rounded-full animate-spin"></div></div>}>
        <ConversationForm onComplete={async (data) => {
          if (user?.uid) {
            try {
              const p = await fetchUserProfile(user.uid);
              if (data.income) p.income = data.income;
              if (data.expenses) p.expenses = data.expenses;
              if (data.loans && data.loans.length > 0) {
                p.loans = data.loans.map((l: any) => l.principal);
              }
              
              const netWorth = calculateNetWorth(p);
              const savingsRate = calculateSavingsRate(p);
              const debtRatio = calculateDebtRatio(p);
              const fhs = calculateFHS(p);
              p.metrics = { netWorth, savingsRate, debtRatio, financialHealthScore: fhs };
              
              p.insights = generateInsights(p);

              await saveUserProfile(user.uid, p);
              await refreshProfile();
            } catch (err) {
              console.error("Failed to save onboarding", err);
            }
          }
          onComplete();
        }} />
      </Suspense>
    </>
  );
}

