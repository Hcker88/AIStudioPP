import { GoogleGenAI, Type, Schema } from '@google/genai';
import { FullProfile } from './types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ExtractedDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "The primary intent of the user (e.g., ADD_INCOME, ADD_EXPENSE, BUY_STOCK, GENERAL_QUERY)",
    },
    extractedEntities: {
      type: Type.OBJECT,
      properties: {
        incomes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              frequency: { type: Type.STRING, enum: ["MONTHLY", "YEARLY", "ONE_TIME"] }
            }
          }
        },
        expenses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              isFixed: { type: Type.BOOLEAN }
            }
          }
        },
        loans: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              principalAmount: { type: Type.NUMBER },
              interestRate: { type: Type.NUMBER },
              monthlyEmi: { type: Type.NUMBER }
            }
          }
        },
        assets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER }
            }
          }
        },
        subscriptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              cycle: { type: Type.STRING, enum: ["MONTHLY", "YEARLY"] }
            }
          }
        },
        holdings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              assetName: { type: Type.STRING },
              assetType: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              buyPrice: { type: Type.NUMBER }
            }
          }
        },
        goals: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              targetAmount: { type: Type.NUMBER },
              targetDate: { type: Type.STRING, description: 'ISO 8601 Date string' }
            }
          }
        }
      }
    }
  }
};

export async function parseFinancialInput(message: string, currentProfile: Partial<FullProfile>) {
  const systemInstruction = `You are an expert NLP parser for a personal finance copilot.
Your job is to extract financial entities from user messages accurately.
Support Indian numbering formats (Lakh=100k, Crore=10m, k=1000). All amounts must be parsed to raw numbers in INR unless otherwise specified.
Current Profile context is provided so you can understand updates, but you must only return newly extracted data diffs.
If the user mentions "salary", map it to income. "rent" to expense. "bought TCS shares" to holdings.
`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      { role: "user", parts: [{ text: `Current Profile Context: ${JSON.stringify(currentProfile)}\n\nUser Message: ${message}` }] }
    ],
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: ExtractedDataSchema
    }
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    return { intent: "GENERAL_QUERY", extractedEntities: {} };
  }
}
