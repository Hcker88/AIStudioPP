/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "@google/genai";
import { formatINR } from '../lib/formatters';

export interface EmergencyBufferResult {
  currentBuffer: number;
  requiredBuffer: number;
  monthsCovered: number;
  strategy: 'DEBT_AVALANCHE' | 'CASH_CUSHION';
  recommendation: string;
  mitigationSteps: string[];
}

/**
 * Recalculates the "Debt Avalanche" into a "Cash Cushion" strategy.
 * Preserves liquidity over ROI when the user is worried about a recession or job loss.
 */
export function calculateEmergencyBuffer(
  monthlyExpenses: number,
  currentSavings: number,
  totalDebtEmi: number,
  isRecessionWorried: boolean = false
): EmergencyBufferResult {
  const totalMonthlyBurn = monthlyExpenses + totalDebtEmi;
  const requiredBuffer = totalMonthlyBurn * 6; // 6 months of total burn
  const monthsCovered = currentSavings / (totalMonthlyBurn || 1);
  
  const strategy = (isRecessionWorried || monthsCovered < 3) ? 'CASH_CUSHION' : 'DEBT_AVALANCHE';
  
  let recommendation = "";
  let mitigationSteps: string[] = [];

  if (strategy === 'CASH_CUSHION') {
    recommendation = `PIVOT: Pause aggressive debt payoff. Redirect ₹${formatINR(5000)} extra monthly to your Emergency Fund until you hit ₹${formatINR(requiredBuffer)}.`;
    mitigationSteps = [
      "Pause all non-essential SIPs/investments.",
      "Pay only minimum EMIs on all loans.",
      "Cut discretionary spending (OTT, Dining, Travel) by 30%.",
      "Liquidate low-yield assets (e.g., dormant FDs) into a sweep-in account."
    ];
  } else {
    recommendation = "STAY THE COURSE: Your liquidity is strong. Continue the Debt Avalanche to save on interest.";
    mitigationSteps = [
      "Maintain 6-month buffer.",
      "Continue aggressive payoff of highest interest loan.",
      "Review strategy quarterly."
    ];
  }

  return {
    currentBuffer: currentSavings,
    requiredBuffer,
    monthsCovered: Math.round(monthsCovered * 10) / 10,
    strategy,
    recommendation,
    mitigationSteps
  };
}

export const emergencyBufferTool = {
  name: "calculate_emergency_buffer",
  description: "Recalculates financial strategy to prioritize liquidity (Cash Cushion) over debt payoff (Avalanche) during high-risk periods like job loss or recession.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      monthlyExpenses: { type: Type.NUMBER, description: "Total monthly living expenses excluding EMIs." },
      currentSavings: { type: Type.NUMBER, description: "Current liquid cash/savings available." },
      totalDebtEmi: { type: Type.NUMBER, description: "Total monthly EMI obligations." },
      isRecessionWorried: { type: Type.BOOLEAN, description: "Whether the user is explicitly worried about a recession or job loss." }
    },
    required: ["monthlyExpenses", "currentSavings", "totalDebtEmi"]
  }
};

export interface MarketRoiResult {
  equityRoi: number;
  goldRoi: number;
  sgbRoi: number;
  recommendation: string;
  comparison: string;
}

/**
 * Bharat Market Pulse: Compares Equity, Physical Gold, and SGBs.
 */
export function getMarketRoiData(): MarketRoiResult {
  // Historical averages for India
  const equityRoi = 12.5; // Nifty 50 10yr avg
  const goldRoi = 8.2;   // Physical Gold avg
  const sgbRoi = 10.7;   // Gold (8.2%) + 2.5% SGB Fixed Interest

  const comparison = `Equity (Index Funds) has historically outperformed Gold by ~4.3% annually. However, Physical Gold carries a 'making charge' and storage risk that SGBs eliminate.`;
  
  const recommendation = `PIVOT FROM PHYSICAL GOLD: If you hold physical gold for investment, consider Sovereign Gold Bonds (SGB). You get the gold price appreciation PLUS a guaranteed 2.5% annual interest. If your debt interest is >10%, prioritize debt payoff over new gold purchases.`;

  return {
    equityRoi,
    goldRoi,
    sgbRoi,
    recommendation,
    comparison
  };
}

export const marketRoiTool = {
  name: "get_market_roi_data",
  description: "Provides historical ROI data for Indian markets, specifically comparing Equity, Physical Gold, and Sovereign Gold Bonds (SGB).",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

export const taxSearchTool = {
  name: "search_indian_tax_updates",
  description: "Performs a real-time search for the latest Indian Income Tax Slab changes or RBI Repo Rate announcements.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { 
        type: Type.STRING, 
        description: "The specific tax or rate update to search for (e.g., 'RBI Repo Rate March 2026', 'Income Tax Slabs 2026-27')" 
      }
    },
    required: ["query"]
  }
};

export const protectionGapTool = {
  name: "analyze_protection_gap",
  description: "Calculates the 'Protection Gap' for the primary earner, considering total debt and 10 years of family expenses versus current term insurance.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      totalDebt: { type: Type.NUMBER, description: "Total outstanding debt of the household." },
      monthlyExpenses: { type: Type.NUMBER, description: "Average monthly living expenses of the family." },
      currentInsurance: { type: Type.NUMBER, description: "Total term insurance coverage (Sum Assured)." }
    },
    required: ["totalDebt", "monthlyExpenses", "currentInsurance"]
  }
};

export const taxLossHarvestingTool = {
  name: "calculate_tax_loss_harvesting",
  description: "Identifies opportunities for Tax-Loss Harvesting in Equity/Mutual Funds to optimize the 'Wealth Gap' up to the ₹1.25L LTCG limit.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      portfolioValue: { type: Type.NUMBER, description: "Total value of equity/MF portfolio." },
      unrealizedLosses: { type: Type.NUMBER, description: "Total unrealized losses in the portfolio." },
      realizedGains: { type: Type.NUMBER, description: "Total realized capital gains in the current financial year." }
    },
    required: ["portfolioValue", "unrealizedLosses", "realizedGains"]
  }
};

export const rebalancingTool = {
  name: "recommend_rebalancing_action",
  description: "Suggests a 'Hard Pivot' strategy (e.g., switching from Avalanche to Snowball) when the Strategy Confidence Score drops below 70%.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      confidenceScore: { type: Type.NUMBER, description: "The current strategy confidence score (0-100)." },
      currentMethod: { type: Type.STRING, description: "The current debt payoff method (e.g., 'AVALANCHE', 'SNOWBALL')." },
      liquidityBuffer: { type: Type.NUMBER, description: "Current liquid cash available for emergencies." }
    },
    required: ["confidenceScore", "currentMethod", "liquidityBuffer"]
  }
};

export const expensePsychologyTool = {
  name: "analyze_expense_psychology",
  description: "Scans the expenses table for patterns (e.g., 'Late Night Swiggy/Zomato spikes') and suggests behavioral changes.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expenses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            timestamp: { type: Type.STRING }
          }
        }
      }
    },
    required: ["expenses"]
  }
};
