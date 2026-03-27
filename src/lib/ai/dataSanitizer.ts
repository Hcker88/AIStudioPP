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

    if (numValue < 0) {
      return {
        isValid: false,
        type: 'CORRECTION',
        message: `Interest rates cannot be negative. We've adjusted it to ${Math.abs(numValue)}%.`,
        correctedValue: Math.abs(numValue)
      };
    }

    // Common error: Entering EMI in interest rate field or impossible rates
    if (numValue > 100) {
      // If it's something crazy like 500%, they might have meant 5.00% or 50%
      const corrected = numValue > 1000 ? numValue / 100 : numValue / 10;
      return {
        isValid: false,
        type: 'CORRECTION',
        message: `${numValue}% is an impossible interest rate. Did you mean ${corrected}%?`,
        correctedValue: corrected
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
      return { 
        isValid: false, 
        type: 'CORRECTION', 
        message: `Amounts cannot be negative. We've adjusted it to ₹${Math.abs(numValue).toLocaleString('en-IN')}.`,
        correctedValue: Math.abs(numValue)
      };
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
