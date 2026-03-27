/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AuditResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Final Audit Tool
 * Checks for data inconsistencies in loans, expenses, and income.
 */
export const systemAudit = {
  /**
   * Checks for data inconsistencies.
   */
  checkInconsistencies: (
    loans: { name: string; principal: number }[],
    expenses: number,
    income: number
  ): AuditResult => {
    const errors: string[] = [];

    // Check for negative loan balances
    loans.forEach(loan => {
      if (loan.principal < 0) {
        errors.push(`Negative balance detected in ${loan.name}.`);
      }
    });

    // Check if expenses exceed income by 500%
    if (expenses > income * 5) {
      errors.push(`Expenses (₹${expenses.toLocaleString('en-IN')}) exceed income (₹${income.toLocaleString('en-IN')}) by over 500%.`);
    }

    // Check for zero income with high debt
    if (income === 0 && loans.length > 0) {
      errors.push(`Zero income reported with active debt obligations.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Generates an AI prompt if audit fails.
   */
  getAIPrompt: (result: AuditResult, userName: string): string | null => {
    if (result.isValid) return null;

    return `${userName}, I see a mismatch in your financial data: ${result.errors.join(' ')} Did you make an unrecorded payment or update your income recently?`;
  }
};
