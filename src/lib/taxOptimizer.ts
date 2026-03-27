/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatINR } from './formatters';

export interface TaxBenefitResult {
  postTaxInterestRate: number;
  taxSavingsAnnual: number;
  verdict: string;
  comparison: string;
}

/**
 * Bharat Tax-Saver Tool
 * Calculates the "Post-Tax Benefit" of interest deduction (Section 24(b))
 * and compares it against investment ROI (e.g., ELSS under Section 80C).
 */
export function calculateTaxBenefit(
  loanInterestRate: number,
  loanPrincipal: number,
  taxBracket: number = 30, // Default to 30% for high earners
  isHomeLoan: boolean = true
): TaxBenefitResult {
  // Section 24(b) allows deduction up to ₹2,00,000 on interest for self-occupied property
  const annualInterest = (loanPrincipal * (loanInterestRate / 100));
  const deductibleInterest = Math.min(annualInterest, 200000);
  
  const taxSavingsAnnual = deductibleInterest * (taxBracket / 100);
  const effectiveAnnualInterest = annualInterest - taxSavingsAnnual;
  const postTaxInterestRate = (effectiveAnnualInterest / loanPrincipal) * 100;

  let verdict = "";
  let comparison = "";

  if (postTaxInterestRate < 10) { // Assuming 10-12% ROI for ELSS/SIP
    verdict = `KEEP THE LOAN: Your effective interest rate is ₹${postTaxInterestRate.toFixed(2)}% after tax benefits. Investing in an ELSS (12% ROI) is mathematically superior to prepaying this debt.`;
    comparison = `Investing ₹1,50,000 in ELSS (Section 80C) yields ₹18,000 in returns + ₹45,000 in tax savings (at 30% bracket). Total ROI: 42% in Year 1.`;
  } else {
    verdict = `PREPAY THE DEBT: Even with tax benefits, your effective rate is ₹${postTaxInterestRate.toFixed(2)}%. Prepaying this debt provides a guaranteed return higher than most safe investments.`;
    comparison = `Debt payoff is a guaranteed return. Market volatility makes a ${postTaxInterestRate.toFixed(2)}% guaranteed return highly attractive.`;
  }

  return {
    postTaxInterestRate: Math.round(postTaxInterestRate * 100) / 100,
    taxSavingsAnnual: Math.round(taxSavingsAnnual),
    verdict,
    comparison
  };
}
