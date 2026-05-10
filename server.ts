import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.0-flash";

const ONBOARDING_QUESTIONS = [
  "What is your monthly income?",
  "Roughly how much do you spend monthly?",
  "How much savings do you currently have?",
  "Do you have any loans?",
  "How much is your total outstanding loan amount?",
  "How much EMI do you pay monthly?",
  "Do you invest in stocks or gold?",
  "How much do you have invested in stocks/mutual funds?",
  "How much do you have invested in gold?",
  "What is your main financial goal right now?"
];

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CSP Hardening
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data: https:; frame-ancestors 'self';"
    );
    next();
  });

  // Set up health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Endpoint with Validation
  const chatSchema = z.object({
    message: z.string().max(1000).optional(),
    onboardingStep: z.number().min(0).max(100).optional(),
    history: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000)
      })
    ).max(20).optional(),
    profileSummary: z.string().max(2000).optional()
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const parsed = chatSchema.parse(req.body);
      
      let userMessage = parsed.message || "";
      if (parsed.onboardingStep !== undefined) {
        const onboardingQ = ONBOARDING_QUESTIONS[parsed.onboardingStep] || "Tell me more.";
        userMessage = `Question Context: ${onboardingQ}\nUser Response: ${userMessage}`;
      }

      let historyContext = "";
      if (parsed.history && parsed.history.length > 0) {
        historyContext = "Recent chat history:\n" + parsed.history.slice(-5).map(h => `${h.role}: ${h.content}`).join("\n");
      }

      const prompt = `You are a tough, intelligent financial advisor chat assistant for PapaProfit app. 
The user's current financial profile summary:
${parsed.profileSummary || "No data provided."}

${historyContext}

User message: "${userMessage}"

Provide a brief, helpful, and direct response (1-3 sentences). Do not break character. Do not mention you are an AI. Answer their question based on their financial data context.`;

      // Fallback/Retry handled gracefully
      let responseText = "I'm here to help, but having trouble connecting right now.";
      try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt
        });
        if (response?.text) responseText = response.text;
      } catch (geminiErr: any) {
        console.error("Gemini API Error:", geminiErr?.message || geminiErr);
        // Graceful fallback logging
        responseText = "I'm experiencing high traffic right now. Let's focus on your actions instead of chatting.";
      }

      res.json({ text: responseText });
    } catch (e: any) {
      console.error("Chat validation/processing error:", e);
      res.status(400).json({ error: "Invalid request payload." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();

