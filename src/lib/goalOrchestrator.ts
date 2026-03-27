/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { differenceInMonths } from 'date-fns';

export interface GoalConflictResult {
  goalName: string;
  fundingGap: number;
  requiredMonthly: number;
  isPossible: boolean;
  conflictMessage?: string;
}

/**
 * Goal Conflict Resolver
 * Calculates the funding gap and monthly requirements for financial goals.
 */
export const goalOrchestrator = {
  /**
   * Calculates the gap between target and current savings, and the monthly savings needed.
   */
  calculateGap: (targetAmount: number, currentSavings: number, targetDate: Date): GoalConflictResult & { goalName: string } => {
    const monthsLeft = Math.max(1, differenceInMonths(targetDate, new Date()));
    const fundingGap = targetAmount - currentSavings;
    const requiredMonthly = fundingGap / monthsLeft;

    return {
      goalName: '', // To be filled by caller
      fundingGap,
      requiredMonthly,
      isPossible: true, // Basic calculation doesn't check against income yet
    };
  },

  /**
   * Checks if a new goal conflicts with existing debt obligations and income.
   */
  checkConflict: (
    goal: { name: string; targetAmount: number; currentSavings: number; targetDate: Date },
    monthlyDisposableIncome: number,
    totalDebtEmi: number
  ): GoalConflictResult => {
    const gapAnalysis = goalOrchestrator.calculateGap(goal.targetAmount, goal.currentSavings, goal.targetDate);
    const availableForSavings = monthlyDisposableIncome - totalDebtEmi;
    
    const isPossible = gapAnalysis.requiredMonthly <= availableForSavings;
    
    let conflictMessage = "";
    if (!isPossible) {
      const shortfall = gapAnalysis.requiredMonthly - availableForSavings;
      conflictMessage = `To fund the '${goal.name}' by ${goal.targetDate.toLocaleDateString()}, you must increase monthly savings by ₹${Math.round(shortfall).toLocaleString('en-IN')} OR extend your debt payoff timeline.`;
    }

    return {
      ...gapAnalysis,
      goalName: goal.name,
      isPossible,
      conflictMessage
    };
  }
};
