import React, { Suspense } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { fetchUserProfile, saveUserProfile } from '../../lib/profileDb';
import { calculateNetWorth, calculateSavingsRate, calculateDebtRatio, calculateFHS } from '../../lib/finance';
import { generateInsights } from '../../lib/insights';
import { ConversationForm } from '../onboarding/ConversationForm';

interface OnboardingSectionProps {
  onComplete: () => void;
}

export function OnboardingSection({
  onComplete
}: OnboardingSectionProps) {
  const { user, refreshProfile } = useFinance();

  return (
    <>
      <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-t-[#F27D26] border-white/10 rounded-full animate-spin"></div></div>}>
        <ConversationForm onComplete={async (data) => {
          if (user?.uid) {
            try {
              const p = await fetchUserProfile(user.uid);
              if (data.income !== undefined) p.income = data.income;
              if (data.incomeType) p.incomeType = data.incomeType;
              if (data.expenses !== undefined) p.expenses = data.expenses;
              if (data.savings !== undefined) p.savings = data.savings;
              
              if (data.loans && data.loans.length > 0) {
                p.loans = data.loans;
              }
              if (data.emi !== undefined) p.emi = data.emi;
              
              if (data.assets) {
                if (data.assets.stocks) {
                  p.assets.stocks = [{ name: 'Portfolio', quantity: 1, buyPrice: data.assets.stocks, currentPrice: data.assets.stocks }];
                }
                if (data.assets.gold) {
                  p.assets.gold = data.assets.gold;
                }
              }

              if (data.goals && data.goals.length > 0) {
                p.goals = data.goals;
              }

              if (data.habits) {
                p.habits = data.habits;
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

