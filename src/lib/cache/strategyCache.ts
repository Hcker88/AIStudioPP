/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  versionHash: string;
}

const STRATEGY_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Map<string, CacheEntry<any>>();

/**
 * Generates a version hash based on user's core financial data.
 * If these change, the cache must be invalidated.
 */
export const generateVersionHash = (totalDebt: number, monthlyIncome: number, expenses: number): string => {
  const data = `${totalDebt}-${monthlyIncome}-${expenses}`;
  return createHash('sha256').update(data).digest('hex');
};

/**
 * Strategy Cache Layer
 * Stores expensive Monte Carlo results and complex joins.
 */
export const strategyCache = {
  get: <T>(userId: string, currentVersionHash: string): T | null => {
    const entry = cache.get(userId);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > STRATEGY_CACHE_TTL;
    const isStale = entry.versionHash !== currentVersionHash;

    if (isExpired || isStale) {
      cache.delete(userId);
      return null;
    }

    return entry.data as T;
  },

  set: <T>(userId: string, data: T, versionHash: string): void => {
    cache.set(userId, {
      data,
      timestamp: Date.now(),
      versionHash
    });
  },

  invalidate: (userId: string): void => {
    cache.delete(userId);
  }
};
