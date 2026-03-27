/**
 * Projection Engine
 * Calculates two parallel timelines: Status Quo vs AI Strategy
 */

export interface ProjectionPoint {
  year: number;
  netWorthA: number; // Status Quo
  netWorthB: number; // AI Strategy (Avalanche + Investment)
}

export interface Loan {
  principal: number;
  interestRate: number;
  emi: number;
}

export function calculateProjections(
  monthlyIncome: number,
  monthlyExpenses: number,
  loans: Loan[],
  extraMonthly: number,
  investmentRoi: number = 12, // Default Indian Equity ROI
  years: number = 20,
  statusQuoRoi: number = 7 // Default Indian FD ROI
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  
  let statusQuoNetWorth = 0;
  let aiStrategyNetWorth = 0;
  
  // Clone loans for simulation
  let loansA = loans.map(l => ({ ...l }));
  let loansB = loans.map(l => ({ ...l }));
  
  // Sort loans for Avalanche (highest interest first)
  loansB.sort((a, b) => b.interestRate - a.interestRate);

  for (let y = 0; y <= years; y++) {
    points.push({
      year: y,
      netWorthA: Math.round(statusQuoNetWorth),
      netWorthB: Math.round(aiStrategyNetWorth)
    });

    // Monthly simulation for the next year
    for (let m = 0; m < 12; m++) {
      // --- Timeline A: Status Quo ---
      let monthlySavingsA = monthlyIncome - monthlyExpenses;
      for (const loan of loansA) {
        if (loan.principal > 0) {
          const interest = (loan.principal * (loan.interestRate / 100)) / 12;
          const principalPaid = Math.min(loan.principal, Math.max(0, loan.emi - interest));
          loan.principal -= principalPaid;
          monthlySavingsA -= loan.emi;
        }
      }
      // Invest remaining savings at FD rates (7%)
      statusQuoNetWorth += monthlySavingsA;
      statusQuoNetWorth *= (1 + statusQuoRoi / 100 / 12);

      // --- Timeline B: AI Strategy ---
      let monthlySavingsB = monthlyIncome - monthlyExpenses;
      let availableForExtra = extraMonthly;
      
      for (const loan of loansB) {
        if (loan.principal > 0) {
          const interest = (loan.principal * (loan.interestRate / 100)) / 12;
          const standardPrincipalPaid = Math.min(loan.principal, Math.max(0, loan.emi - interest));
          loan.principal -= standardPrincipalPaid;
          monthlySavingsB -= loan.emi;
          
          // Apply extra payment to highest interest loan
          if (availableForExtra > 0 && loan.principal > 0) {
            const extraPaid = Math.min(loan.principal, availableForExtra);
            loan.principal -= extraPaid;
            availableForExtra -= extraPaid;
          }
        }
      }
      
      // Invest remaining savings + unused extra payment at Equity ROI (12%)
      // CRITICAL: If net worth is negative, prioritize liquidity (Survival Mode)
      const currentRoi = aiStrategyNetWorth < 0 ? 4 : investmentRoi; // 4% for liquid savings vs 12% for equity
      aiStrategyNetWorth += (monthlySavingsB + availableForExtra);
      aiStrategyNetWorth *= (1 + currentRoi / 100 / 12);
    }
  }

  return points;
}
