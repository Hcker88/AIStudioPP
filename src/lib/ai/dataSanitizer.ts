/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export interface SanitizationResult {
  isValid: boolean;
  correctedValue?: number;
  message?: string;
  type: 'CORRECTION' | 'WARNING' | 'ERROR';
}

/**
 * Fuzzy Data Sanitizer
 * Intercepts common data entry errors for the Indian financial market.
 */
export const dataSanitizer = {
  /**
   * Validates and sanitizes interest rates.
   * Common errors: 10% entered as 100, or 50,000 entered as interest rate.
   */
  sanitizeInterestRate: (value: number | string): SanitizationResult => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

    if (isNaN(numValue)) {
      return { isValid: false, type: 'ERROR', message: 'Please enter a valid number.' };
    }

    // Common error: Entering EMI in interest rate field
    if (numValue > 100) {
      return {
        isValid: false,
        type: 'CORRECTION',
        message: `₹${numValue.toLocaleString('en-IN')} seems high for an interest rate. Did you mean ${numValue / 1000}% or ₹${numValue.toLocaleString('en-IN')} in EMI?`,
        correctedValue: numValue / 1000 // Heuristic: maybe they meant 5% but typed 5000?
      };
    }

    // Common error: Entering 100% for 10%
    if (numValue > 50) {
      return {
        isValid: false,
        type: 'WARNING',
        message: `${numValue}% is unusually high for the Indian market (typical Home Loan: 8-10%, Personal: 12-18%). Please verify.`,
      };
    }

    return { isValid: true, type: 'CORRECTION' };
  },

  /**
   * Validates and sanitizes income/expense amounts.
   */
  sanitizeAmount: (value: number | string): SanitizationResult => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

    if (isNaN(numValue)) {
      return { isValid: false, type: 'ERROR', message: 'Please enter a valid number.' };
    }

    if (numValue < 0) {
      return { isValid: false, type: 'ERROR', message: 'Amount cannot be negative.' };
    }

    // Common error: Monthly income entered as annual
    if (numValue > 10000000) { // > 1Cr monthly
      return {
        isValid: false,
        type: 'CORRECTION',
        message: `₹${numValue.toLocaleString('en-IN')} is a very high monthly amount. Did you mean this as your annual income?`,
        correctedValue: Math.round(numValue / 12)
      };
    }

    return { isValid: true, type: 'CORRECTION' };
  }
};

// Zod schemas with custom refinements for fuzzy data
export const FinancialSchema = z.object({
  monthlyIncome: z.number().min(1000).max(5000000).refine(val => val < 1000000, {
    message: "Monthly income above 10L is rare. Please verify if this is annual."
  }),
  interestRate: z.number().min(0).max(50).refine(val => val < 30, {
    message: "Interest rates above 30% are extreme. Please verify."
  }),
  emi: z.number().min(0)
});
