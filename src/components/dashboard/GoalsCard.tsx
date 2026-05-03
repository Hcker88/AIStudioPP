import React from 'react';
import { Target } from 'lucide-react';
import { FinancialGoal } from '../../lib/types';
import { formatINR } from '../../lib/formatters';

export function GoalsCard({ goals, isPrivacyMode }: { goals: FinancialGoal[], isPrivacyMode: boolean }) {
  if (!goals || goals.length === 0) {
    return (
      <div className="bg-[#18181f] border border-white/8 rounded-xl p-6 text-center text-white/50">
        <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No financial goals set. Ask the AI Copilot to set one.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181f] border border-white/8 rounded-xl overflow-hidden mt-6">
      <div className="p-6 border-b border-white/8 flex justify-between items-center bg-black/20">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4 text-[#F27D26]" />
          Financial Goals
        </h3>
      </div>
      <div className="p-6 flex flex-col gap-6">
        {goals.map((g, i) => {
          const progress = g.targetAmount > 0 ? (g.currentSavings / g.targetAmount) * 100 : 0;
          return (
            <div key={i} className="flex flex-col gap-2 border-b border-white/5 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold">{g.name}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-50">Target Date: {new Date(g.targetDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">{formatINR(g.currentSavings, true, isPrivacyMode)} / {formatINR(g.targetAmount, true, isPrivacyMode)}</p>
                  <p className="text-[10px] opacity-50">{progress.toFixed(1)}% Completed</p>
                </div>
              </div>
              
              <div className="w-full bg-black rounded-full h-2 mt-2">
                <div className="bg-[#F27D26] h-2 rounded-full" style={{ width: `${Math.min(100, progress)}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
