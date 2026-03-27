import { db } from "../lib/db";
import { loans, users, financialGoals } from "../lib/schema";
import { eq, and, desc } from "drizzle-orm";

export const annualReportService = {
  /**
   * Generate a "Spotify Wrapped" style summary for the user's financial year.
   */
  async generateUserReport(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return null;

    const userLoans = await db.select().from(loans).where(eq(loans.profileId, userId));
    const goals = await db.select().from(financialGoals).where(eq(financialGoals.userId, userId));

    // Mock data for demonstration
    const interestKilled = 125000; // Total ₹ saved
    const goalProgress = goals.map(g => ({
      name: g.name,
      progress: Math.min(100, (Number(g.currentSavings) / Number(g.targetAmount)) * 100)
    }));
    const resilienceJump = 15; // Improvement over 12 months

    return {
      interestKilled,
      goalProgress,
      resilienceJump,
      currentScore: user[0].disciplineScore,
      userName: user[0].name
    };
  }
};
