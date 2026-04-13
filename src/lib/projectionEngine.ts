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
  
  let assetsA = 0;
  let assetsB = 0;
  
  // Clone loans for simulation
  let loansA = loans.map(l => ({ ...l }));
  let loansB = loans.map(l => ({ ...l }));
  
  // Sort loans for Avalanche (highest interest first)
  loansB.sort((a, b) => b.interestRate - a.interestRate);

  for (let y = 0; y <= years; y++) {
    const totalDebtA = loansA.reduce((sum, l) => sum + l.principal, 0);
    const totalDebtB = loansB.reduce((sum, l) => sum + l.principal, 0);

    points.push({
      year: y,
      netWorthA: Math.round(assetsA - totalDebtA),
      netWorthB: Math.round(assetsB - totalDebtB)
    });

    // Monthly simulation for the next year
    for (let m = 0; m < 12; m++) {
      // --- Timeline A: Status Quo ---
      let monthlySavingsA = monthlyIncome - monthlyExpenses;
      for (const loan of loansA) {
        if (loan.principal > 0) {
          const interest = (loan.principal * (loan.interestRate / 100)) / 12;
          const principalPaid = loan.emi - interest;
          loan.principal -= principalPaid;
          if (loan.principal < 0) loan.principal = 0; // Cap at 0
          monthlySavingsA -= loan.emi;
        }
      }
      
      if (monthlySavingsA >= 0) {
        assetsA += monthlySavingsA;
        assetsA *= (1 + statusQuoRoi / 100 / 12);
      } else {
        // If savings are negative, we eat into assets. If assets < 0, it's effectively unsecured debt.
        assetsA += monthlySavingsA;
        if (assetsA > 0) {
          assetsA *= (1 + statusQuoRoi / 100 / 12);
        } else {
          assetsA *= (1 + 18 / 100 / 12); // Assume 18% penalty debt rate for negative assets
        }
      }

      // --- Timeline B: AI Strategy ---
      let monthlySavingsB = monthlyIncome - monthlyExpenses;
      let availableForExtra = extraMonthly;
      
      for (const loan of loansB) {
        if (loan.principal > 0) {
          const interest = (loan.principal * (loan.interestRate / 100)) / 12;
          const standardPrincipalPaid = loan.emi - interest;
          loan.principal -= standardPrincipalPaid;
          if (loan.principal < 0) loan.principal = 0;
          monthlySavingsB -= loan.emi;
          
          // Apply extra payment to highest interest loan
          if (availableForExtra > 0 && loan.principal > 0) {
            const extraPaid = Math.min(loan.principal, availableForExtra);
            loan.principal -= extraPaid;
            availableForExtra -= extraPaid;
          }
        }
      }
      
      const totalCashB = monthlySavingsB + availableForExtra;
      if (totalCashB >= 0) {
        assetsB += totalCashB;
        // CRITICAL: If net worth is negative, prioritize liquidity (Survival Mode)
        const currentRoi = (assetsB - loansB.reduce((sum, l) => sum + l.principal, 0)) < 0 ? 4 : investmentRoi;
        assetsB *= (1 + currentRoi / 100 / 12);
      } else {
        assetsB += totalCashB;
        if (assetsB > 0) {
          assetsB *= (1 + investmentRoi / 100 / 12);
        } else {
          assetsB *= (1 + 18 / 100 / 12); // Assume 18% penalty debt rate for negative assets
        }
      }
    }
  }

  return points;
}
