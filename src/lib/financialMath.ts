/**
 * Deterministic Financial Math Engine
 * Prevents LLM numerical hallucinations by handling all calculations in pure JS/TS.
 */

export interface Loan {
  name: string;
  interestRate: number;
  principal: number;
  emi: number;
}

export interface Investment {
  expectedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Calculates the Annualized ROI (CAGR)
 */
export function calculateAnnualizedROI(initialValue: number, finalValue: number, years: number): number {
  if (years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Compares Debt Payoff vs Investment ROI
 * Returns a structured comparison to be consumed by the UI and the AI.
 */
export function compareDebtVsInvestment(debtRate: number, investmentROI: number) {
  const delta = debtRate - investmentROI;
  const recommendation = delta > 0 
    ? "PAY_DEBT" 
    : (delta < -2 ? "INVEST" : "NEUTRAL");

  return {
    debtRate: Number(debtRate.toFixed(2)),
    investmentROI: Number(investmentROI.toFixed(2)),
    delta: Number(delta.toFixed(2)),
    recommendation,
    reasoning: delta > 0 
      ? `Paying off debt yields a guaranteed ${debtRate}% return, which is higher than the projected ${investmentROI}% ROI.`
      : `The projected ${investmentROI}% ROI exceeds the ${debtRate}% cost of debt, though debt payoff remains a guaranteed return.`
  };
}

/**
 * Calculates the total interest saved by paying off a loan early
 */
export function calculateInterestSaved(principal: number, annualRate: number, monthsRemaining: number, extraPayment: number): number {
  const monthlyRate = annualRate / 12 / 100;
  
  // Standard total interest remaining
  const standardTotalInterest = (principal * monthlyRate * monthsRemaining); // Simplified for strategy comparison
  
  // This is a simplified model for the strategy dashboard
  // Real amortization would be used for high-precision views
  return standardTotalInterest * (extraPayment / principal);
}

/**
 * Calculates Burn Rate
 */
export function calculateBurnRate(income: number, totalExpenses: number, totalEmis: number): number {
  return (totalExpenses + totalEmis) / income;
}
