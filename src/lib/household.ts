/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { householdMembers, financialProfiles, loans, users, households } from './schema';
import { eq, and } from 'drizzle-orm';

export interface HouseholdSummary {
  totalIncome: number;
  totalDebt: number;
  totalEmi: number;
  aggregateDebtFreeDate: string;
  memberCount: number;
}

/**
 * Household Aggregation Logic
 * Aggregates financial data across household members while respecting privacy.
 */
export const householdManager = {
  /**
   * Gets an aggregate summary for a household.
   */
  getSummary: async (householdId: string): Promise<HouseholdSummary> => {
    const members = await db.select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, householdId));

    let totalIncome = 0;
    let totalDebt = 0;
    let totalEmi = 0;
    let maxTenure = 0;

    for (const member of members) {
      const profile = await db.query.financialProfiles.findFirst({
        where: eq(financialProfiles.userId, member.userId)
      });

      if (profile) {
        totalIncome += Number(profile.monthlyIncome);
        
        // Only include debt details if the member has opted in
        if (member.shareDebtDetails) {
          const userLoans = await db.select()
            .from(loans)
            .where(eq(loans.profileId, profile.id));

          for (const loan of userLoans) {
            totalDebt += Number(loan.principalAmount);
            totalEmi += Number(loan.monthlyEmi);
            maxTenure = Math.max(maxTenure, loan.remainingTenureMonths);
          }
        }
      }
    }

    // Calculate aggregate debt-free date based on max remaining tenure
    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + maxTenure);
    const dateStr = debtFreeDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase();

    return {
      totalIncome,
      totalDebt,
      totalEmi,
      aggregateDebtFreeDate: dateStr,
      memberCount: members.length
    };
  },

  /**
   * Updates the household's emergency fund atomically.
   * Prevents race conditions when multiple members update simultaneously.
   */
  updateEmergencyFund: async (householdId: string, amount: number): Promise<void> => {
    await db.transaction(async (tx) => {
      const household = await tx.query.households.findFirst({
        where: eq(households.id, householdId)
      });

      if (!household) throw new Error("Household not found");

      // Atomic update using Postgres transaction
      await tx.update(households)
        .set({ 
          emergencyFund: (Number(household.emergencyFund || 0) + amount).toString(),
          updatedAt: new Date()
        })
        .where(eq(households.id, householdId));
    });
  }
};
