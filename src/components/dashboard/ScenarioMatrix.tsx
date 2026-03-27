/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { formatINR } from '../../lib/formatters';
import { runStressTest, StressTestResult } from '../../lib/stressTest';
import { Loan } from '../../lib/projectionEngine';
import { cn } from '../../lib/utils';

interface ScenarioMatrixProps {
  income: number;
  expenses: number;
  loans: Loan[];
  extraMonthly: number;
  investmentRoi: number;
}

export function ScenarioMatrix({ income, expenses, loans, extraMonthly, investmentRoi }: ScenarioMatrixProps) {
  const scenarios = runStressTest(income, expenses, loans, extraMonthly, investmentRoi);

  return (
    <div className="bg-white/5 border border-white/10 rounded-sm overflow-hidden">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F27D26]" />
          <span className="text-xs font-bold uppercase tracking-widest">Stress Test: Resilience Matrix</span>
        </div>
        <div className="flex items-center gap-2 opacity-40">
          <Info size={12} />
          <span className="text-[10px] uppercase tracking-tighter italic">Simulating Year 10 Impact</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Scenario</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Resilience</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Debt-Free Date</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">NW Impact (₹)</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Mitigation Step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scenarios.map((scenario, i) => (
              <motion.tr 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{scenario.scenarioName}</span>
                    <span className="text-[10px] opacity-40 uppercase tracking-tighter">Market Shock</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          scenario.resilienceScore > 70 ? "bg-emerald-500" : 
                          scenario.resilienceScore > 40 ? "bg-amber-500" : "bg-crimson-500"
                        )}
                        style={{ width: `${scenario.resilienceScore}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      scenario.resilienceScore > 70 ? "text-emerald-500" : 
                      scenario.resilienceScore > 40 ? "text-amber-500" : "text-red-500"
                    )}>
                      {scenario.resilienceScore}%
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "text-xs font-mono",
                    scenario.debtFreeDateChange === "No change" ? "text-emerald-500" : "text-red-500"
                  )}>
                    {scenario.debtFreeDateChange}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    {scenario.netWorthImpact >= 0 ? (
                      <TrendingUp size={12} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={12} className="text-red-500" />
                    )}
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      scenario.netWorthImpact >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {formatINR(Math.abs(scenario.netWorthImpact))}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-[11px] leading-relaxed opacity-60 italic max-w-xs">
                    "{scenario.mitigationStep}"
                  </p>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
