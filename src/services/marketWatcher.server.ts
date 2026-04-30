import { GoogleGenAI } from "@google/genai";
import { db } from "../lib/db";
import { marketSnapshots } from "../lib/schema";
import { desc } from "drizzle-orm";
import { env } from "../lib/env.server";

let _ai: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!_ai) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

export const marketWatcher = {
  /**
   * Weekly ping for Nifty 50 and Repo Rate levels.
   */
  async refreshMarketPulse() {
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: "What is the current Nifty 50 level and the RBI Repo Rate in India? Return as JSON: { \"nifty50\": number, \"repoRate\": number }",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text || '{}');
      const { nifty50 = 24000, repoRate = 6.5 } = data;

      // Check for significant shift (>0.5%)
      const lastSnapshot = await db.select()
        .from(marketSnapshots)
        .orderBy(desc(marketSnapshots.capturedAt))
        .limit(1);

      if (lastSnapshot.length > 0) {
        const prevNifty = Number(lastSnapshot[0].nifty50);
        const prevRepo = Number(lastSnapshot[0].repoRate);
        
        const niftyShift = Math.abs((nifty50 - prevNifty) / prevNifty);
        const repoShift = Math.abs((repoRate - prevRepo) / prevRepo);

        if (niftyShift > 0.005 || repoShift > 0.005) {
          console.log("Significant market shift detected. Nudging projection engine...");
          // In a real app, this would trigger a background job for all users
        }
      }

      await db.insert(marketSnapshots).values({
        nifty50: nifty50.toString(),
        repoRate: repoRate.toString(),
      });

      return { nifty50, repoRate };
    } catch (error) {
      console.error("Failed to refresh market pulse:", error);
      return null;
    }
  }
};
