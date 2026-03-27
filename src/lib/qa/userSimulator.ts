/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateProjections, Loan } from '../projectionEngine';
import { goalOrchestrator } from '../goalOrchestrator';
import { addYears } from 'date-fns';

export interface Persona {
  name: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  loans: Loan[];
  extraMonthly: number;
  assets: number;
}

export const PERSONAS: Persona[] = [
  {
    name: "The Debt Trap",
    monthlyIncome: 40000,
    monthlyExpenses: 38000, // 95% burn rate
    loans: [
      { principal: 1500000, interestRate: 36, emi: 45000 } // Impossible EMI for income
    ],
    extraMonthly: 0,
    assets: 0
  },
  {
    name: "The Asset Rich/Cash Poor",
    monthlyIncome: 100000,
    monthlyExpenses: 40000,
    loans: [
      { principal: 5000000, interestRate: 9, emi: 45000 }
    ],
    extraMonthly: 0,
    assets: 20000000 // 2Cr property
  },
  {
    name: "The Windfall Winner",
    monthlyIncome: 150000,
    monthlyExpenses: 50000,
    loans: [
      { principal: 2000000, interestRate: 12, emi: 30000 }
    ],
    extraMonthly: 5000000, // Windfall applied as "extra" for one simulation
    assets: 0
  },
  {
    name: "The Debt-Free Builder",
    monthlyIncome: 200000,
    monthlyExpenses: 50000,
    loans: [],
    extraMonthly: 50000,
    assets: 1000000
  },
  {
    name: "The High-Income Overspender",
    monthlyIncome: 500000,
    monthlyExpenses: 450000,
    loans: [
      { principal: 10000000, interestRate: 10, emi: 100000 },
      { principal: 2000000, interestRate: 18, emi: 50000 }
    ],
    extraMonthly: 0,
    assets: 500000
  }
];

export function runSimulation() {
  const results = PERSONAS.map(persona => {
    console.log(`--- Testing Persona: ${persona.name} ---`);
    
    // Test Projection Engine
    try {
      const projections = calculateProjections(
        persona.monthlyIncome,
        persona.monthlyExpenses,
        persona.loans,
        persona.extraMonthly,
        12,
        20
      );
      
      const finalPoint = projections[projections.length - 1];
      console.log(`Final Net Worth (AI): ₹${finalPoint.netWorthB.toLocaleString('en-IN')}`);
      
      if (finalPoint.netWorthB < 0) {
        console.warn(`[BUG] Negative Wealth detected for ${persona.name}. Engine should prioritize Survival Mode.`);
      }
      
      // Check for infinite loops or weird jumps
      for (let i = 1; i < projections.length; i++) {
        if (isNaN(projections[i].netWorthB)) {
          console.error(`[CRITICAL] NaN detected in projections for ${persona.name}`);
        }
      }

    } catch (error) {
      console.error(`[CRITICAL] Projection Engine crashed for ${persona.name}:`, error);
    }

    // Test Goal Orchestrator
    try {
      const goal = {
        name: "Retirement",
        targetAmount: 50000000,
        currentSavings: persona.assets,
        targetDate: addYears(new Date(), 20)
      };
      
      const totalEmi = persona.loans.reduce((acc, l) => acc + l.emi, 0);
      const disposable = persona.monthlyIncome - persona.monthlyExpenses;
      
      const conflict = goalOrchestrator.checkConflict(goal, disposable, totalEmi);
      console.log(`Goal Conflict: ${conflict.isPossible ? 'No Conflict' : 'Conflict Detected'}`);
      if (conflict.conflictMessage) {
        console.log(`Message: ${conflict.conflictMessage}`);
      }
    } catch (error) {
      console.error(`[CRITICAL] Goal Orchestrator crashed for ${persona.name}:`, error);
    }

    return persona.name;
  });

  return results;
}
