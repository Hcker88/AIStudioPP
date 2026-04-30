import { GoogleGenAI } from "@google/genai";
import { env } from "../lib/env.server";
import { AIPrivacyProxy } from "../services/ai_proxy.server";

export async function parseStatementText(text: string) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const maskedText = AIPrivacyProxy.mask(text);

  const prompt = `
You are a financial data parser. I am providing you with the text content of a user's bank statement, credit card statement, or loan summary.
Extract the relevant financial information and return ONLY a JSON response conforming to the following structure.

If some fields are not present, do your best to infer or return empty arrays.

Expected JSON format:
{
  "incomes": [{ "source": "string", "amount": "number" }],
  "expenses": [{ "category": "string", "amount": "number", "isFixed": "boolean" }],
  "assets": [{ "name": "string", "amount": "number", "type": "CASH | EQUITY | REAL_ESTATE | DEBT" }],
  "loans": [{ "name": "string", "principal": "number", "emi": "number", "rate": "number" }]
}

STATEMENT TEXT:
${maskedText}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Parse error:", error);
    return null;
  }
}
