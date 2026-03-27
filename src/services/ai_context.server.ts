import { db } from '../lib/db';
import { financialProfiles, loans, householdMembers, marketSnapshots, adviceAttribution } from '../lib/schema';
import { eq, desc } from 'drizzle-orm';
import { SYSTEM_PROMPT_BASE } from '../lib/prompts';
import { householdManager } from '../lib/household';

/**
 * AI Context Injector
 * Fetches user financial data and prepares the system prompt for the LLM.
 */
export async function getAIPromptContext(userId: string) {
  // 1. Fetch user profile and loans
  const profile = await db.query.financialProfiles.findFirst({
    where: eq(financialProfiles.userId, userId),
  });

  // If profile doesn't exist, return base prompt
  if (!profile) return SYSTEM_PROMPT_BASE;

  const userLoans = await db.query.loans.findMany({
    where: eq(loans.profileId, profile.id),
  });

  // Check if user is in a household
  const membership = await db.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, userId)
  });

  let householdSummary = null;
  if (membership) {
    householdSummary = await householdManager.getSummary(membership.householdId);
  }

  // 2. Fetch latest market pulse
  const latestMarket = await db.query.marketSnapshots.findFirst({
    orderBy: [desc(marketSnapshots.capturedAt)]
  });

  // 3. Fetch advice attribution
  const attribution = await db.query.adviceAttribution.findMany({
    where: eq(adviceAttribution.userId, userId)
  });

  // 4. Format into token-efficient JSON
  const contextData = {
    income: Number(profile.monthlyIncome),
    currency: profile.currency,
    debts: userLoans.map(l => ({
      n: l.name,
      p: Number(l.principalAmount),
      r: Number(l.interestRate),
      e: Number(l.monthlyEmi),
      t: l.remainingTenureMonths
    })),
    household: householdSummary,
    market: latestMarket ? {
      nifty: latestMarket.nifty50,
      repo: latestMarket.repoRate,
      lastUpdate: latestMarket.capturedAt
    } : null,
    attribution: attribution.map(a => ({
      type: a.adviceType,
      ignored: a.ignoreCount,
      followed: a.isFollowed
    }))
  };

  const contextString = `
USER_FINANCIAL_SNAPSHOT:
${JSON.stringify(contextData)}

STRATEGY_SUMMARY:
- Total Debt: ${contextData.debts.reduce((acc, d) => acc + d.p, 0)}
- Highest Rate: ${Math.max(...contextData.debts.map(d => d.r), 0)}%
- Monthly Obligations: ${contextData.debts.reduce((acc, d) => acc + d.e, 0)}
${householdSummary ? `- Household Total Income: ${householdSummary.totalIncome}\n- Household Total Debt: ${householdSummary.totalDebt}\n- Household Debt-Free: ${householdSummary.aggregateDebtFreeDate}` : ''}
${latestMarket ? `- Market Pulse: Nifty 50 @ ${latestMarket.nifty50}, Repo Rate @ ${latestMarket.repoRate}%` : ''}
${attribution.length > 0 ? `- Advice History: ${attribution.filter(a => a.ignoreCount > 0).map(a => `${a.adviceType} ignored ${a.ignoreCount} times`).join(', ')}` : ''}
  `.trim();

  // 3. Wrap in System Prompt
  return SYSTEM_PROMPT_BASE.replace('{{USER_FINANCIAL_CONTEXT}}', contextString);
}
