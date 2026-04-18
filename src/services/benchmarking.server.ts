/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../lib/db';
import { users, financialProfiles } from '../lib/schema';
import { eq, sql, avg } from 'drizzle-orm';

export interface BenchmarkData {
  avgResilienceScore: number;
  avgBurnRate: number;
  percentile: number;
  location: string;
}

/**
 * Bharat Benchmark Service
 * Aggregates anonymized financial data for community benchmarking.
 */
export const benchmarking = {
  /**
   * Aggregates anonymized resilience scores and burn rates.
   */
  getBenchmark: async (incomeBracket: number, location: string): Promise<BenchmarkData> => {
    try {
      // In a real app, this would query the database for users in the same income bracket and location.
      
      const stats = await db.select({
        avgScore: avg(users.disciplineScore),
      }).from(users);

      const avgScore = Number(stats[0]?.avgScore || 50);
      
      const percentile = 82; // Example: "Top 18%"

      return {
        avgResilienceScore: avgScore,
        avgBurnRate: 45,
        percentile,
        location
      };
    } catch (error) {
      console.error('Benchmarking failed:', error);
      return {
        avgResilienceScore: 50,
        avgBurnRate: 50,
        percentile: 50,
        location: 'India'
      };
    }
  }
};
