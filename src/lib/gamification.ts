/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { users } from './schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Behavioral Milestone Logic
 * Tracks "Financial Discipline Streaks" and updates the discipline score.
 */
export const gamification = {
  /**
   * Updates the user's discipline score and streak based on their monthly adherence.
   * @param userId The user's ID.
   * @param isAdherent Whether the user stayed under their "Burn Rate" this month.
   */
  updateDiscipline: async (userId: string, isAdherent: boolean) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) return null;

      let newStreak = isAdherent ? user.streakMonths + 1 : 0;
      
      // Score logic: 
      // +5 for adherence, +10 for hitting a 3-month streak.
      // -10 for breaking a streak.
      let scoreChange = isAdherent ? 5 : -10;
      if (isAdherent && newStreak % 3 === 0 && newStreak > 0) {
        scoreChange += 10;
      }

      const newScore = Math.min(100, Math.max(0, user.disciplineScore + scoreChange));

      await db.update(users)
        .set({
          disciplineScore: newScore,
          streakMonths: newStreak,
        })
        .where(eq(users.id, userId));

      return {
        newScore,
        newStreak,
        unlockedPremium: newStreak >= 3,
      };
    } catch (error) {
      console.error('Gamification update failed:', error);
      return null;
    }
  },

  /**
   * Checks if the user has unlocked "Premium Strategy Mode".
   */
  isPremiumUnlocked: (streakMonths: number) => {
    return streakMonths >= 3;
  }
};
