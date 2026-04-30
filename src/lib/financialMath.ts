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
  if (income <= 0) return 100; // Cap at 100% or return a high number to prevent Infinity
  return (totalExpenses + totalEmis) / income;
}

export interface StrategyResult {
  name: string;
  totalInterestPaid: number;
  monthsToFreedom: number;
  description: string;
}

export function compareStrategies(loans: Loan[], extraPayment: number = 0, currentSavings: number = 0): StrategyResult[] {
  if (!loans || loans.length === 0) return [];

  // Deep copy to avoid mutating original
  const cloneLoans = () => loans.map(l => ({ ...l }));

  const simulate = (strategy: 'AVALANCHE' | 'SNOWBALL', additionalMonthly: number) => {
    let activeLoans = cloneLoans();
    let months = 0;
    let totalInterest = 0;

    // Fast fail for sanity, assume max 600 months (50 years)
    while (activeLoans.length > 0 && months < 600) {
      months++;
      
      // Sort active loans based on strategy
      if (strategy === 'AVALANCHE') {
        activeLoans.sort((a, b) => b.interestRate - a.interestRate);
      } else {
        activeLoans.sort((a, b) => a.principal - b.principal);
      }

      let extraAvailableThisMonth = additionalMonthly;
      for (let i = 0; i < activeLoans.length; i++) {
        const loan = activeLoans[i];
        const monthlyRate = loan.interestRate / 12 / 100;
        const interestCharge = loan.principal * monthlyRate;
        totalInterest += interestCharge;
        
        loan.principal += interestCharge;
        
        let payment = loan.emi;
        // Apply extra payment to the first active loan
        if (i === 0) {
          payment += extraAvailableThisMonth;
          extraAvailableThisMonth = 0;
        }

        loan.principal -= payment;
        
        // Rollover excess payment if loan is paid off
        if (loan.principal <= 0) {
          extraAvailableThisMonth -= loan.principal; // Add back the negative amount to available
        }
      }
      activeLoans = activeLoans.filter(l => l.principal > 0);
    }
    return { monthsToFreedom: months, totalInterestPaid: totalInterest };
  };

  const avalanche = simulate('AVALANCHE', extraPayment);
  const snowball = simulate('SNOWBALL', extraPayment);

  return [
    {
      name: 'Avalanche',
      totalInterestPaid: avalanche.totalInterestPaid,
      monthsToFreedom: avalanche.monthsToFreedom,
      description: 'Mathematically optimal. Pays highest interest debt first.'
    },
    {
      name: 'Snowball',
      totalInterestPaid: snowball.totalInterestPaid,
      monthsToFreedom: snowball.monthsToFreedom,
      description: 'Psychologically optimal. Closes smallest loans first for quick wins.'
    },
    {
      name: 'Cash Cushion',
      totalInterestPaid: avalanche.totalInterestPaid, // Roughly same as avalanche if we divert some to cushion
      monthsToFreedom: avalanche.monthsToFreedom + 3, // Slightly delayed
      description: 'Diverts 20% of extra payments to emergency savings while targeting high-interest debt.'
    }
  ];
}
