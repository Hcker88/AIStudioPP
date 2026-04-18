/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../lib/db';
import { financialProfiles, savedStrategies, expenses } from '../lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Strategy Drift Cron Service
 * Simulates a cron job that checks for strategy drift.
 */
export async function checkStrategyDrift(userId: string) {
  try {
    // 1. Get user's profile and saved strategy
    const profile = await db.query.financialProfiles.findFirst({
      where: eq(financialProfiles.userId, userId),
    });
    
    const strategy = await db.query.savedStrategies.findFirst({
      where: eq(savedStrategies.userId, userId),
      orderBy: (strategies, { desc }) => [desc(strategies.createdAt)],
    });

    if (!profile || !strategy) return null;

    const userExpenses = await db.query.expenses.findMany({
      where: eq(expenses.profileId, profile.id),
    });

    // 2. Compare actual burn rate vs saved strategy
    const actualExpenses = userExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const plannedExpenses = 45000; // Fallback as it's not in strategy
    
    const driftPercentage = ((actualExpenses - plannedExpenses) / plannedExpenses) * 100;

    if (driftPercentage > 10) {
      // 3. Trigger Strategy Drift Alert
      return {
        type: 'STRATEGY_DRIFT',
        driftPercentage: Math.round(driftPercentage),
        message: `STRATEGY DRIFT: Your actual burn rate is ₹${actualExpenses} (₹${actualExpenses - plannedExpenses} over budget). This will delay your debt-free date by approximately 4 months.`,
        aiCorrectionPrompt: `I noticed your discretionary spending rose by ₹${actualExpenses - plannedExpenses} this month. Should we adjust your Debt-Free Date or find a way to offset this?`
      };
    }

    return null;
  } catch (error) {
    console.error('Drift check failed:', error);
    return null;
  }
}
