/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BudgetOverrun {
  category: string;
  limit: number;
  actual: number;
  overrun: number;
}

export interface HealProposal {
  source: string;
  amount: number;
  impact: string;
}

/**
 * Self-Healing Budget Engine
 * Monitors category overruns and proposes fund reallocations.
 */
export const budgetHealer = {
  /**
   * Detects category overruns and proposes a "Heal" by pulling from lower-priority goals.
   */
  detectOverrun: (category: string, limit: number, actual: number): BudgetOverrun | null => {
    if (actual > limit) {
      return {
        category,
        limit,
        actual,
        overrun: actual - limit
      };
    }
    return null;
  },

  /**
   * Proposes a "Heal" by pulling from lower-priority goals or sinking funds.
   */
  proposeHeal: (overrun: number, sinkingFunds: { name: string; amount: number }[]): HealProposal | null => {
    // Sort sinking funds by priority (assume later due dates are lower priority)
    // For now, just pick the largest sinking fund
    const sortedFunds = [...sinkingFunds].sort((a, b) => b.amount - a.amount);
    
    if (sortedFunds.length > 0) {
      const source = sortedFunds[0];
      return {
        source: source.name,
        amount: overrun,
        impact: `Redirecting ₹${overrun.toLocaleString('en-IN')} from your '${source.name}' will keep your debt payoff goal on track, but will delay the '${source.name}' target by ~1 month.`
      };
    }
    
    return null;
  }
};
