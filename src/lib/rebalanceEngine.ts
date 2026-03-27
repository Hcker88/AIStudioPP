/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PortfolioSummary {
  totalEquity: number;
  totalDebt: number;
  totalCash: number;
  currentEquityPercentage: number;
  targetEquityPercentage: number;
  drift: number;
}

/**
 * Portfolio Drift Monitor
 * Compares current asset allocation against target strategy.
 */
export const rebalanceEngine = {
  calculateDrift: (
    assets: { type: 'EQUITY' | 'DEBT' | 'CASH'; balance: number }[],
    targetEquityPercentage: number
  ): PortfolioSummary => {
    let totalEquity = 0;
    let totalDebt = 0;
    let totalCash = 0;

    assets.forEach(asset => {
      if (asset.type === 'EQUITY') totalEquity += asset.balance;
      else if (asset.type === 'DEBT') totalDebt += asset.balance;
      else if (asset.type === 'CASH') totalCash += asset.balance;
    });

    const totalAssets = totalEquity + totalDebt + totalCash;
    const currentEquityPercentage = (totalEquity / totalAssets) * 100;
    const drift = currentEquityPercentage - targetEquityPercentage;

    return {
      totalEquity,
      totalDebt,
      totalCash,
      currentEquityPercentage,
      targetEquityPercentage,
      drift
    };
  },

  /**
   * Generates a "Profit Booking" Nudge if drift exceeds threshold.
   */
  getNudge: (summary: PortfolioSummary, homeLoanInterestRate: number) => {
    if (summary.drift >= 10) { // 10% drift threshold
      const amountToRebalance = (summary.drift / 100) * (summary.totalEquity + summary.totalDebt + summary.totalCash);
      const interestSaved = amountToRebalance * (homeLoanInterestRate / 100) * 5; // Estimated 5 years savings

      return {
        type: 'PROFIT_BOOKING',
        message: `Nifty is at an all-time high. Your strategy suggests moving ₹${amountToRebalance.toLocaleString('en-IN')} from Equity to your Home Loan to 'lock in' gains and save ₹${interestSaved.toLocaleString('en-IN')} in future interest.`,
        amount: amountToRebalance
      };
    }
    return null;
  }
};
