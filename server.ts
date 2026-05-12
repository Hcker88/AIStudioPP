import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import admin from 'firebase-admin';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (reads from firebase-applet-config.json server-side only)
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  const cfg = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
  admin.initializeApp({ projectId: cfg.projectId });
} else {
  admin.initializeApp();
}

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const MODEL_NAME = "gemini-3-flash-preview";

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

  app.set("trust proxy", 1);
  app.use(express.json());

  // CSP Hardening
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data: https:; frame-ancestors *;"
    );
    next();
  });

  // Set up health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Endpoint with Validation
  const chatSchema = z.object({
    message: z.string().max(10000).optional(),
    onboardingStep: z.number().min(0).max(ONBOARDING_QUESTIONS.length - 1).optional(),
    history: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(10000)
      })
    ).optional(),
    profileSummary: z.string().max(10000).optional()
  });

  const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many requests. Please wait before chatting again.' },
    validate: { xForwardedForHeader: false }
  });

  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      (req as any).user = await admin.auth().verifyIdToken(token);
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  app.post("/api/chat", requireAuth, chatLimiter, async (req, res) => {
    try {
      const parsed = chatSchema.parse(req.body);
      
      let historyContext = "";
      if (parsed.history && parsed.history.length > 0) {
        historyContext = "Recent chat history:\n" + parsed.history.slice(-5).map(h => `${h.role}: ${h.content}`).join("\n");
      }

      const onboardingCtx = parsed.onboardingStep !== undefined && parsed.onboardingStep < ONBOARDING_QUESTIONS.length
        ? `\nCurrent onboarding question being answered: "${ONBOARDING_QUESTIONS[parsed.onboardingStep]}"`
        : '';

      // Fallback/Retry handled gracefully
      let responseText = "I'm here to help, but having trouble connecting right now.";
      try {
        const response = await getAI().models.generateContent({
          model: MODEL_NAME,
          contents: [{ role: 'user', parts: [{ text: parsed.message || '' }] }],
          config: {
            systemInstruction: `You are a tough, intelligent financial advisor for PapaProfit app.
The user's current financial profile:
${parsed.profileSummary || "No data provided."}
${historyContext}${onboardingCtx}
Provide a brief, helpful, direct response (1-3 sentences). Do not mention you are an AI.`,
            temperature: 0.7,
            maxOutputTokens: 300
          }
        });
        if (response?.text) responseText = response.text;
      } catch (geminiErr: any) {
        console.error("Gemini API Error:", geminiErr?.message || geminiErr);
        // Graceful fallback logging
        responseText = "I'm experiencing high traffic right now. Let's focus on your actions instead of chatting.";
      }

      res.json({ text: responseText });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
         console.error("Chat validation/processing error: ZodError:", JSON.stringify((e as z.ZodError).errors));
         res.status(400).json({ error: "Invalid request payload.", details: (e as z.ZodError).errors });
      } else {
         console.error("Chat validation/processing error:", e.message || e);
         res.status(500).json({ error: "Gemini API Error: " + (e.message || String(e)) });
      }
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

