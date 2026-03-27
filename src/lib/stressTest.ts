/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loan, calculateProjections, ProjectionPoint } from './projectionEngine';

export interface StressTestResult {
  scenarioName: string;
  resilienceScore: number; // 1-100
  debtFreeDateChange: string; // e.g. "+14 months"
  netWorthImpact: number; // at Year 10
  mitigationStep: string;
}

export function runStressTest(
  income: number,
  expenses: number,
  loans: Loan[],
  extraMonthly: number,
  investmentRoi: number = 12
): StressTestResult[] {
  // Base projection for comparison
  const basePoints = calculateProjections(income, expenses, loans, extraMonthly, investmentRoi);
  const baseYear10NW = basePoints.find(p => p.year === 10)?.netWorthB || 0;
  const baseDebtFreePoint = basePoints.find(p => p.netWorthB > 0 && p.year > 0);
  const baseDebtFreeYear = baseDebtFreePoint ? baseDebtFreePoint.year : 2035;

  const scenarios = [
    {
      name: "The Lost Decade",
      roi: 0,
      interestAdj: 0,
      incomeAdj: 1,
      description: "0% Stock Market ROI for 10 years."
    },
    {
      name: "The Hyper-Inflation",
      roi: investmentRoi,
      interestAdj: 3,
      incomeAdj: 1,
      description: "Variable interest rates jump by 3%."
    },
    {
      name: "The Job Loss",
      roi: investmentRoi,
      interestAdj: 0,
      incomeAdj: 0.5, // 6 months of zero income = 50% income for the first year
      description: "6 months of zero income."
    }
  ];

  return scenarios.map(s => {
    const adjustedLoans = loans.map(l => ({
      ...l,
      interestRate: l.interestRate + s.interestAdj
    }));

    const scenarioPoints = calculateProjections(
      income * s.incomeAdj, 
      expenses, 
      adjustedLoans, 
      extraMonthly, 
      s.roi
    );

    const scenarioYear10NW = scenarioPoints.find(p => p.year === 10)?.netWorthB || 0;
    const nwImpact = scenarioYear10NW - baseYear10NW;
    
    const scenarioDebtFreePoint = scenarioPoints.find(p => p.netWorthB > 0 && p.year > 0);
    const scenarioDebtFreeYear = scenarioDebtFreePoint ? scenarioDebtFreePoint.year : 2040;
    const yearDiff = scenarioDebtFreeYear - baseDebtFreeYear;
    const dateChange = yearDiff > 0 ? `+${yearDiff} years` : (yearDiff < 0 ? `-${Math.abs(yearDiff)} years` : "No change");

    const resilienceScore = Math.min(100, Math.max(0, Math.round((scenarioYear10NW / (baseYear10NW || 1)) * 100)));

    let mitigation = "Maintain current strategy.";
    if (resilienceScore < 40) {
      mitigation = `Cut ₹${Math.round(expenses * 0.25)} from discretionary expenses to survive.`;
    } else if (resilienceScore < 70) {
      mitigation = "Increase emergency fund to 12 months of expenses.";
    }

    return {
      scenarioName: s.name,
      resilienceScore,
      debtFreeDateChange: dateChange,
      netWorthImpact: nwImpact,
      mitigationStep: mitigation
    };
  });
}
