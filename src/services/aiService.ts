import { GoogleGenAI } from "@google/genai";
import { generateSystemPrompt } from "../lib/prompts";
import { StrategyAuditor } from "./ai_auditor.server";

export class AIService {
  private ai: GoogleGenAI;
  private auditor: StrategyAuditor;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.auditor = new StrategyAuditor(apiKey);
  }

  async getStrategyAdvice(userProfile: any, loans: any[], userMessage: string) {
    const systemInstruction = generateSystemPrompt(userProfile, loans);
    
    // 1. Primary AI Response
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for financial precision
      }
    });

    const primaryText = response.text;

    // 2. Hidden Audit Step
    const auditCheck = await this.auditor.auditStrategy(primaryText);

    // 3. Append Audit if necessary
    if (auditCheck) {
      return `${primaryText}\n\n**CONSERVATIVE REALITY CHECK:**\n${auditCheck}`;
    }

    return primaryText;
  }
}
