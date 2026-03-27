import { db } from '../lib/db';
import { financialProfiles, loans, expenses } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { compareDebtVsInvestment } from '../lib/financialMath';
import { differenceInHours } from 'date-fns';

/**
 * Dashboard Loader Logic
 * Aggregates financial data and performs deterministic math.
 */
export async function loadDashboardData(userId: string) {
  const profile = await db.query.financialProfiles.findFirst({
    where: eq(financialProfiles.userId, userId),
  });

  if (!profile) return { profile: null };

  const userLoans = await db.query.loans.findMany({
    where: eq(loans.profileId, profile.id),
  });

  const userExpenses = await db.query.expenses.findMany({
    where: eq(expenses.profileId, profile.id),
  });

  // 1. Check for Stale Data (>24h)
  const isStale = differenceInHours(new Date(), profile.lastSyncedAt) > 24;

  // 2. Pre-calculate Aggregates
  const totalMonthlyDebt = userLoans.reduce((acc, l) => acc + Number(l.monthlyEmi), 0);
  const totalPrincipal = userLoans.reduce((acc, l) => acc + Number(l.principalAmount), 0);
  
  // Weighted Average Interest Rate
  const weightedSum = userLoans.reduce((acc, l) => acc + (Number(l.interestRate) * Number(l.principalAmount)), 0);
  const weightedAverageInterestRate = totalPrincipal > 0 ? weightedSum / totalPrincipal : 0;

  // Projected Debt-Free Date (Simplified: Max tenure)
  const maxTenure = Math.max(...userLoans.map(l => l.remainingTenureMonths), 0);
  
  // Strategy Comparison (Highest Debt vs Benchmark 8% ROI)
  const highestDebtRate = Math.max(...userLoans.map(l => Number(l.interestRate)), 0);
  const strategy = compareDebtVsInvestment(highestDebtRate, 8); // 8% as default benchmark

  return {
    profile: {
      ...profile,
      monthlyIncome: Number(profile.monthlyIncome),
    },
    loans: userLoans.map(l => ({
      ...l,
      principalAmount: Number(l.principalAmount),
      interestRate: Number(l.interestRate),
      monthlyEmi: Number(l.monthlyEmi),
    })),
    expenses: userExpenses.map(e => ({
      ...e,
      amount: Number(e.amount),
    })),
    aggregates: {
      totalMonthlyDebt,
      totalPrincipal,
      weightedAverageInterestRate: Number(weightedAverageInterestRate.toFixed(2)),
      projectedDebtFreeMonths: maxTenure,
      isStale,
    },
    strategy,
  };
}
