import { db } from '../db';
import { adviceAttribution } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export interface AdviceMetadata {
  userId: string;
  adviceType: string;
  adviceContent: string;
  targetLoanId?: string;
}

export const attributionLogger = {
  /**
   * Log that advice was given. If it's been ignored 3 times, suggest a pivot.
   */
  async logAdviceGiven(metadata: AdviceMetadata) {
    const existing = await db.select()
      .from(adviceAttribution)
      .where(
        and(
          eq(adviceAttribution.userId, metadata.userId),
          eq(adviceAttribution.adviceType, metadata.adviceType),
          eq(adviceAttribution.isFollowed, false)
        )
      )
      .orderBy(desc(adviceAttribution.lastOfferedAt))
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0];
      const newIgnoreCount = record.ignoreCount + 1;
      
      await db.update(adviceAttribution)
        .set({ 
          ignoreCount: newIgnoreCount,
          lastOfferedAt: new Date()
        })
        .where(eq(adviceAttribution.id, record.id));

      if (newIgnoreCount >= 3) {
        return {
          shouldPivot: true,
          pivotMessage: `I noticed we haven't acted on the ${metadata.adviceType} advice yet. Is the commitment too high? Let's try a smaller, more manageable goal instead.`
        };
      }
    } else {
      await db.insert(adviceAttribution).values({
        userId: metadata.userId,
        adviceType: metadata.adviceType,
        adviceContent: metadata.adviceContent,
        targetLoanId: metadata.targetLoanId,
        ignoreCount: 0,
        isFollowed: false,
      });
    }

    return { shouldPivot: false };
  },

  /**
   * Mark advice as followed when the user performs the action.
   */
  async markAsFollowed(userId: string, adviceType: string) {
    await db.update(adviceAttribution)
      .set({ isFollowed: true })
      .where(
        and(
          eq(adviceAttribution.userId, userId),
          eq(adviceAttribution.adviceType, adviceType),
          eq(adviceAttribution.isFollowed, false)
        )
      );
  }
};
