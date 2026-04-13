import { db } from '../lib/db';
import { financialProfiles, expenses } from '../lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Strategy Health & Burn Report Service
 */
export async function generateBurnReport(userId: string) {
  const profile = await db.query.financialProfiles.findFirst({
    where: eq(financialProfiles.userId, userId),
  });

  if (!profile) return null;

  const userExpenses = await db.query.expenses.findMany({
    where: eq(expenses.profileId, profile.id),
  });

  const totalExpenses = userExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const monthlyIncome = Number(profile.monthlyIncome);

  // AI Logic: Calculate "Retirement Days Traded"
  // Formula: (Expense Increase / (Monthly Income * 0.05 ROI)) * 30 days
  // This is a simplified heuristic for the "Burn Report"
  
  return {
    userId,
    totalExpenses,
    burnRate: (totalExpenses / monthlyIncome) * 100,
    healthScore: totalExpenses / monthlyIncome > 0.7 ? 'CRITICAL' : 'STABLE',
    message: totalExpenses / monthlyIncome > 0.7 
      ? "Your expenses are exceeding safe thresholds. High spending is delaying your financial goals."
      : "Strategy is stable. Current spending maintains your debt-free target."
  };
}
