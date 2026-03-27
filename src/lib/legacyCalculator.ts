/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProtectionGapResult {
  totalDebt: number;
  tenYearExpenses: number;
  totalRequired: number;
  currentInsurance: number;
  gap: number;
  isCovered: boolean;
  recommendation: string;
}

/**
 * Legacy Calculator (Insurance & Estate)
 * Calculates the "Protection Gap" for the primary earner.
 */
export const legacyCalculator = {
  /**
   * Calculates the "Protection Gap" based on debt and 10 years of expenses.
   */
  calculateProtectionGap: (
    totalDebt: number,
    monthlyExpenses: number,
    currentInsurance: number
  ): ProtectionGapResult => {
    const tenYearExpenses = monthlyExpenses * 12 * 10;
    const totalRequired = totalDebt + tenYearExpenses;
    const gap = Math.max(0, totalRequired - currentInsurance);
    const isCovered = currentInsurance >= totalRequired;

    let recommendation = "";
    if (!isCovered) {
      const gapLakhs = gap / 100000;
      recommendation = `Your current ₹${(currentInsurance / 10000000).toFixed(1)}Cr Term Plan leaves a ₹${gapLakhs.toFixed(1)}L gap if we consider the Home Loan and 10 years of family expenses. Consider a Top-up or a dedicated Mortgage Shield.`;
    } else {
      recommendation = "Your current insurance coverage is sufficient to cover all outstanding debts and 10 years of family expenses.";
    }

    return {
      totalDebt,
      tenYearExpenses,
      totalRequired,
      currentInsurance,
      gap,
      isCovered,
      recommendation
    };
  }
};
