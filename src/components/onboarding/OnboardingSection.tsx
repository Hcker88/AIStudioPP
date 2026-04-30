import React, { Suspense } from 'react';
import { motion } from 'motion/react';
import { ConversationForm } from '../onboarding/ConversationForm';

interface OnboardingSectionProps {
  user: any;
  setOnboardingData: (data: any) => void;
  setIncome: (data: any) => void;
  setExpenses: (data: any) => void;
  setLoans: (data: any) => void;
  onComplete: () => void;
}

export function OnboardingSection({
  user,
  setOnboardingData,
  setIncome,
  setExpenses,
  setLoans,
  onComplete
}: OnboardingSectionProps) {
  return (
    <>
      <div className="mb-16 text-center">
        <span className="text-[#F27D26] font-mono text-sm tracking-widest uppercase">Phase 01: Liabilities</span>
        <h2 className="text-5xl font-bold tracking-tight mt-4 italic serif">The Interrogation.</h2>
        <p className="opacity-50 mt-4 text-lg">We need the raw numbers. Your data is encrypted and never sold.</p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-t-[#F27D26] border-white/10 rounded-full animate-spin"></div></div>}>
        <ConversationForm onComplete={async (data) => {
          console.log('Onboarding Data:', data);
          setOnboardingData(data);
          setIncome(data.income);
          setExpenses(data.expenses);
          
          if (data.loans && data.loans.length > 0) {
            setLoans(data.loans.map((l: any) => ({
              name: l.name,
              principal: l.principal,
              interestRate: l.rate,
              emi: l.emi,
              tenure: Math.ceil(l.principal / l.emi) || 60
            })));
          } else {
            setLoans([]);
          }

          // Wire onboarding data to the backend completely 
          if (user?.id) {
            try {
              await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  monthlyIncome: data.income,
                  loans: data.loans ? data.loans.map((l: any) => ({
                    name: l.name,
                    principal: l.principal,
                    interestRate: l.rate,
                    emi: l.emi,
                    tenure: Math.ceil(l.principal / l.emi) || 60
                  })) : [],
                  expenses: data.detailedExpenses || []
                })
              });
            } catch (err) {
              console.error("Failed to save onboarding to database", err);
            }
          }

          onComplete();
        }} />
      </Suspense>
    </>
  );
}
