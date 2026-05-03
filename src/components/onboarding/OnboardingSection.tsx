import React, { Suspense } from 'react';
import { motion } from 'motion/react';
import { ConversationForm } from '../onboarding/ConversationForm';
import { useFinance } from '../../contexts/FinanceContext';
import { applyParsedUpdates, fetchFullProfile, updateUserMetrics } from '../../lib/persistence';
import { calculateMetrics } from '../../lib/financialEngine';

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
        <p className="opacity-50 mt-4 text-lg">We need the raw numbers. Your data is encrypted and never sold.</p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-t-[#F27D26] border-white/10 rounded-full animate-spin"></div></div>}>
        <ConversationForm onComplete={async (data) => {
          if (user?.uid) {
            try {
              const updates: any = {};
              if (data.income) updates.incomes = [{ source: 'Primary', frequency: 'MONTHLY', amount: data.income }];
              if (data.expenses) updates.expenses = [{ category: 'General', frequency: 'MONTHLY', amount: data.expenses }];
              if (data.loans && data.loans.length > 0) {
                updates.loans = data.loans.map((l: any) => ({
                  name: l.name,
                  principalAmount: l.principal,
                  interestRate: l.rate,
                  monthlyEmi: l.emi,
                  startDate: new Date().toISOString()
                }));
              }
              
              await applyParsedUpdates(user.uid, updates);
              
              const p = await fetchFullProfile(user.uid);
              if (p) {
                 const metrics = calculateMetrics(p);
                 await updateUserMetrics(user.uid, metrics);
                 await refreshProfile();
              }

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

