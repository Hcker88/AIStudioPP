/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MonteCarloResult {
  confidenceScore: number;
  bestCaseNetWorth: number;
  worstCaseNetWorth: number;
  averageNetWorth: number;
  iterations: number;
  range: { month: number; min: number; max: number; avg: number }[];
}

/**
 * Monte Carlo Lite Simulator
 * Runs 100 iterations of inflation and market returns to calculate a confidence score.
 */
export const monteCarloSimulator = {
  run: (
    initialNetWorth: number,
    monthlySavings: number,
    years: number,
    baseInflation: number = 0.06,
    baseMarketReturn: number = 0.12,
    iterations: number = 100
  ): MonteCarloResult => {
    const results: number[][] = [];
    const months = years * 12;

    for (let i = 0; i < iterations; i++) {
      let currentNetWorth = initialNetWorth;
      const iterationResults: number[] = [currentNetWorth];

      // Randomize inflation (5%-8%) and market returns (8%-14%)
      const inflation = 0.05 + Math.random() * 0.03;
      const marketReturn = 0.08 + Math.random() * 0.06;

      const monthlyInflation = Math.pow(1 + inflation, 1 / 12) - 1;
      const monthlyMarketReturn = Math.pow(1 + marketReturn, 1 / 12) - 1;

      for (let m = 1; m <= months; m++) {
        // Grow net worth by market return
        currentNetWorth = currentNetWorth * (1 + monthlyMarketReturn);
        // Add savings (adjusted for inflation)
        currentNetWorth += monthlySavings * Math.pow(1 + monthlyInflation, m / 12);
        iterationResults.push(currentNetWorth);
      }
      results.push(iterationResults);
    }

    // Calculate confidence score (percentage of iterations that end with positive net worth)
    const successfulIterations = results.filter(r => r[months] > 0).length;
    const confidenceScore = (successfulIterations / iterations) * 100;

    // Calculate range for visualization
    const range: { month: number; min: number; max: number; avg: number }[] = [];
    for (let m = 0; m <= months; m++) {
      const valuesAtMonth = results.map(r => r[m]);
      range.push({
        month: m,
        min: Math.min(...valuesAtMonth),
        max: Math.max(...valuesAtMonth),
        avg: valuesAtMonth.reduce((a, b) => a + b, 0) / iterations
      });
    }

    const finalValues = results.map(r => r[months]);
    return {
      confidenceScore,
      bestCaseNetWorth: Math.max(...finalValues),
      worstCaseNetWorth: Math.min(...finalValues),
      averageNetWorth: finalValues.reduce((a, b) => a + b, 0) / iterations,
      iterations,
      range
    };
  }
};
