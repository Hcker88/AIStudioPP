/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Strategy Auditor (Second Agent)
 * Role: Stress-tests the primary AI's recommendation for over-optimism.
 */
export class StrategyAuditor {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async auditStrategy(primaryResponse: string): Promise<string | null> {
    const auditorPrompt = `
      You are a Conservative Financial Auditor for a debt strategist app in India.
      Role: Look for "Over-Optimism" in the following financial advice.
      
      Advice to Audit:
      "${primaryResponse}"
      
      Check for:
      1. Aggressive market returns (e.g., assuming >12% Nifty returns consistently).
      2. Ignoring emergency funds.
      3. Over-leveraging or risky prepayments.
      
      If the plan is too risky or optimistic, provide a "Conservative Reality Check".
      If the plan is already sound and conservative, return "SOUND".
      
      Format for Reality Check:
      "While the primary strategy is aggressive, a 30% market correction would delay your debt-free date by 14 months. Ensure your 6-month Emergency Fund is untouched."
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview", // Fast model for the auditor
        contents: [{ role: "user", parts: [{ text: auditorPrompt }] }],
        config: {
          temperature: 0.1,
        }
      });

      const auditResult = response.text?.trim() || "";
      if (auditResult === "SOUND") return null;
      return auditResult;
    } catch (error) {
      console.error("Audit failed:", error);
      return null;
    }
  }
}
