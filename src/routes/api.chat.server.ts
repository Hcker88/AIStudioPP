import { Type } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import { getAIPromptContext } from "../services/ai_context.server";
import { validateAndSanitizeResponse, extractROIs } from "../lib/ai/validator";
import { compareDebtVsInvestment } from "../lib/financialMath";
import { db } from "../lib/db";
import { financialProfiles, loans } from "../lib/schema";
import { eq, sql } from "drizzle-orm";
import { emergencyBufferTool, calculateEmergencyBuffer, marketRoiTool, getMarketRoiData, taxSearchTool, protectionGapTool, taxLossHarvestingTool, rebalancingTool, expensePsychologyTool } from "../services/ai_tools";
import { StrategyAuditor } from "../services/ai_auditor.server";
import { goalOrchestrator } from "../lib/goalOrchestrator";
import { financialGoals, sinkingFunds, householdMembers } from "../lib/schema";
import { legacyCalculator } from "../lib/legacyCalculator";

import { AIPrivacyProxy } from "../services/ai_proxy.server";
import { strategyCache, generateVersionHash } from "../lib/cache/strategyCache";

export async function handleChatAction(userId: string, userMessage: string, financialData?: any) {
  // 0. Strategy Caching Logic
  let versionHash = '';
  if (financialData) {
    versionHash = generateVersionHash(
      financialData.totalDebt || 0,
      financialData.monthlyIncome || 0,
      financialData.expenses || 0
    );

    const cachedResponse = strategyCache.get(userId || 'default', versionHash);
    if (cachedResponse && userMessage.toLowerCase().includes('strategy')) {
      return `[CACHED STRATEGY]\n${cachedResponse}`;
    }
  }

  // 1. Get System Context (Stateless)
  const systemInstruction = await getAIPromptContext(userId);

  // 2. Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const auditor = new StrategyAuditor(process.env.GEMINI_API_KEY!);
  
  // 3. AI Privacy Proxy - Masking
  const maskedMessage = AIPrivacyProxy.mask(userMessage);

  // 4. Define Tools
  const tools = [
    {
      functionDeclarations: [
        marketRoiTool,
        emergencyBufferTool,
        taxSearchTool,
        protectionGapTool,
        taxLossHarvestingTool,
        rebalancingTool,
        expensePsychologyTool
      ]
    }
  ];

  // 5. Generate Content
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: maskedMessage }] }],
    config: {
      systemInstruction,
      tools,
      temperature: 0.2,
    }
  });

  let finalContent = response.text || "";

  // 5. Handle Function Calls (if any)
  const calls = response.functionCalls;
  if (calls) {
    for (const call of calls) {
      if (call.name === "get_market_roi_data") {
        const result = getMarketRoiData();
        
        // Follow up with the ROI data
        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I will check the Bharat Market Pulse for Equity and Gold.` }] },
            { role: "user", parts: [{ text: `Market Pulse Analysis:
- Equity ROI: ${result.equityRoi}%
- Physical Gold ROI: ${result.goldRoi}%
- SGB ROI: ${result.sgbRoi}%
- Comparison: ${result.comparison}
- Recommendation: ${result.recommendation}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      } else if (call.name === "calculate_emergency_buffer") {
        const { monthlyExpenses, currentSavings, totalDebtEmi, isRecessionWorried } = call.args as any;
        const result = calculateEmergencyBuffer(monthlyExpenses, currentSavings, totalDebtEmi, isRecessionWorried);
        
        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I will recalculate your strategy based on emergency buffer requirements.` }] },
            { role: "user", parts: [{ text: `Emergency Buffer Analysis:
- Current Buffer: ₹${result.currentBuffer}
- Required Buffer: ₹${result.requiredBuffer}
- Strategy: ${result.strategy}
- Recommendation: ${result.recommendation}
- Mitigation Steps: ${result.mitigationSteps.join(', ')}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      } else if (call.name === "search_indian_tax_updates") {
        const { query } = call.args as any;
        // In a real app, this would call a search API. For now, we'll use Google Search grounding if possible,
        // or provide a simulated response based on the query.
        const searchResponse = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [{ role: "user", parts: [{ text: `Search for: ${query}` }] }],
          config: { 
            systemInstruction: "You are a financial news aggregator. Provide a concise summary of the latest updates for the given query.",
            tools: [{ googleSearch: {} }] 
          }
        });
        
        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I am searching for the latest updates on: ${query}` }] },
            { role: "user", parts: [{ text: `Search Results: ${searchResponse.text}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      } else if (call.name === "analyze_protection_gap") {
        const { totalDebt, monthlyExpenses, currentInsurance } = call.args as any;
        const result = legacyCalculator.calculateProtectionGap(totalDebt, monthlyExpenses, currentInsurance);
        
        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I will analyze your protection gap.` }] },
            { role: "user", parts: [{ text: `Protection Gap Analysis:
- Total Debt: ₹${result.totalDebt.toLocaleString('en-IN')}
- 10-Year Expenses: ₹${result.tenYearExpenses.toLocaleString('en-IN')}
- Total Required: ₹${result.totalRequired.toLocaleString('en-IN')}
- Current Insurance: ₹${result.currentInsurance.toLocaleString('en-IN')}
- Gap: ₹${result.gap.toLocaleString('en-IN')}
- Covered: ${result.isCovered ? 'YES' : 'NO'}
- Recommendation: ${result.recommendation}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      } else if (call.name === "calculate_tax_loss_harvesting") {
        const { portfolioValue, unrealizedLosses, realizedGains } = call.args as any;
        // Simple logic for tax loss harvesting
        const harvestable = Math.min(unrealizedLosses, 125000); // LTCG limit
        const recommendation = harvestable > 0 
          ? `You have ₹${harvestable.toLocaleString('en-IN')} in harvestable losses. Selling these and reinvesting can offset your realized gains and save on LTCG tax.`
          : `No significant tax-loss harvesting opportunities found within the ₹1.25L limit.`;

        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I will check for tax-loss harvesting opportunities.` }] },
            { role: "user", parts: [{ text: `Tax-Loss Harvesting Analysis:
- Portfolio Value: ₹${portfolioValue.toLocaleString('en-IN')}
- Unrealized Losses: ₹${unrealizedLosses.toLocaleString('en-IN')}
- Realized Gains: ₹${realizedGains.toLocaleString('en-IN')}
- Recommendation: ${recommendation}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      } else if (call.name === "recommend_rebalancing_action") {
        const { confidenceScore, currentMethod, liquidityBuffer } = call.args as any;
        
        let pivotRecommendation = "";
        if (confidenceScore < 70) {
          pivotRecommendation = `Your strategy confidence has dropped to ${confidenceScore}%. I recommend a 'Hard Pivot' from ${currentMethod} to the 'Snowball' method for 6 months. This will prioritize closing smaller debts to free up ₹${(liquidityBuffer * 0.2).toLocaleString('en-IN')} in monthly cash flow, building a larger safety net.`;
        } else {
          pivotRecommendation = `Your strategy remains robust with a ${confidenceScore}% confidence score. No hard pivot is required at this time.`;
        }

        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I will evaluate if a strategy rebalancing is needed.` }] },
            { role: "user", parts: [{ text: `Rebalancing Analysis:
- Confidence Score: ${confidenceScore}%
- Current Method: ${currentMethod}
- Recommendation: ${pivotRecommendation}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      } else if (call.name === "analyze_expense_psychology") {
        const { expenses } = call.args as any;
        
        // Analysis logic
        const foodSpends = expenses.filter((e: any) => e.category.toLowerCase().includes('food') || e.category.toLowerCase().includes('swiggy') || e.category.toLowerCase().includes('zomato'));
        const totalFood = foodSpends.reduce((acc: number, e: any) => acc + e.amount, 0);
        
        let nudge = "";
        if (totalFood > 5000) {
          nudge = `I noticed a significant spend of ₹${totalFood.toLocaleString('en-IN')} on food delivery. If we redirected just half of this to your Car Loan, you'd be debt-free 4 months sooner. Shall we set a 'Weekend Cap'?`;
        } else {
          nudge = `Your expense patterns look healthy. No major behavioral shifts recommended at this time.`;
        }

        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: `I will analyze your expense psychology.` }] },
            { role: "user", parts: [{ text: `Behavioral Analysis:
- Total Food Delivery: ₹${totalFood.toLocaleString('en-IN')}
- Nudge: ${nudge}` }] }
          ],
          config: { systemInstruction }
        });
        finalContent = followUp.text || "";
      }
    }
  }

  // 6. Anti-Hallucination & Compliance Wrap
  let sanitized = validateAndSanitizeResponse(finalContent);

  // 7. Deterministic Validation Interposition
  const rois = extractROIs(sanitized);
  if (rois.length > 0) {
    // Get user's highest debt for comparison
    const profile = await db.query.financialProfiles.findFirst({ where: eq(financialProfiles.userId, userId) });
    if (profile) {
      const userLoans = await db.query.loans.findMany({ where: eq(loans.profileId, profile.id) });
      const highestDebt = Math.max(...userLoans.map(l => Number(l.interestRate)), 0);
      
      if (highestDebt > 0) {
        const marketROI = rois[0]; // Take the first mentioned ROI
        const comparison = compareDebtVsInvestment(highestDebt, marketROI);
        sanitized += `\n\n[Verified: ${marketROI}% Market vs. ${highestDebt}% Debt = ${comparison.delta}% Net ${comparison.delta > 0 ? 'Loss' : 'Gain'}]`;
      }
    }
  }

  // 8. Hidden Audit Step
  const auditCheck = await auditor.auditStrategy(sanitized);
  if (auditCheck && auditCheck !== "SOUND") {
    sanitized += `\n\n**CONSERVATIVE REALITY CHECK:**\n${auditCheck}`;
  }

  // 9. AI Privacy Proxy - Unmasking
  let unmasked = AIPrivacyProxy.unmask(sanitized);

  // 10. Cache the result if it's a strategy briefing
  if (unmasked.toLowerCase().includes('strategy') && versionHash) {
    strategyCache.set(userId || 'default', unmasked, versionHash);
  }

  return unmasked;
}
