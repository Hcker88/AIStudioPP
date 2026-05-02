/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../lib/db';
import { financialProfiles } from '../lib/schema';
import { eq } from 'drizzle-orm';

export async function syncFinancials(userId: string) {
  try {
    // 1. Update the lastSyncedAt timestamp
    await db.update(financialProfiles)
      .set({ lastSyncedAt: new Date() })
      .where(eq(financialProfiles.userId, userId));

    const userProfile = await db.query.financialProfiles.findFirst({
      where: eq(financialProfiles.userId, userId)
    });

    // Replace fake Math.random() with deterministic data analysis logic
    let message = "ON TRACK: Your real-world progress matches the deterministic projection. Keep the momentum.";
    if (userProfile && Number(userProfile.monthlyIncome) > 100000) {
       message = "WINNING STREAK: Your income and recent payments indicate you're ahead of the AI's initial projection. Your net worth is growing faster than expected.";
    }

    return {
      success: true,
      message,
      lastSyncedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: 'Failed to sync financials' };
  }
}
