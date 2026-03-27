/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { financialProfiles, chatSessions, loans, savedStrategies } from './schema';
import { eq, and } from 'drizzle-orm';

/**
 * Row-Level Security (RLS) equivalent in the application layer.
 * Ensures that users can only access their own data.
 */
export const permissions = {
  /**
   * Scopes a query to the current user's ID.
   */
  scopeToUser: (userId: string) => ({
    profile: () => db.query.financialProfiles.findFirst({
      where: eq(financialProfiles.userId, userId),
    }),
    
    chatSessions: () => db.query.chatSessions.findMany({
      where: eq(chatSessions.userId, userId),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    }),
    
    loans: async (profileId: string) => {
      // Verify profile ownership first
      const profile = await db.query.financialProfiles.findFirst({
        where: and(
          eq(financialProfiles.id, profileId),
          eq(financialProfiles.userId, userId)
        ),
      });
      if (!profile) throw new Error("Unauthorized: Profile does not belong to user");
      
      return db.query.loans.findMany({
        where: eq(loans.profileId, profileId),
      });
    },
    
    strategies: () => db.query.savedStrategies.findMany({
      where: eq(savedStrategies.userId, userId),
      orderBy: (strategies, { desc }) => [desc(strategies.createdAt)],
    }),
  }),

  /**
   * Validates if a user has permission to perform an action on a resource.
   */
  canAccess: async (userId: string, resourceType: 'profile' | 'strategy' | 'chat', resourceId: string) => {
    let resource;
    switch (resourceType) {
      case 'profile':
        resource = await db.query.financialProfiles.findFirst({
          where: and(eq(financialProfiles.id, resourceId), eq(financialProfiles.userId, userId))
        });
        break;
      case 'strategy':
        resource = await db.query.savedStrategies.findFirst({
          where: and(eq(savedStrategies.id, resourceId), eq(savedStrategies.userId, userId))
        });
        break;
      case 'chat':
        resource = await db.query.chatSessions.findFirst({
          where: and(eq(chatSessions.id, resourceId), eq(chatSessions.userId, userId))
        });
        break;
    }
    return !!resource;
  }
};
