import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const { loadDashboardData } = await import("./src/routes/dashboard.server.js");
      const data = await loadDashboardData(req.params.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load dashboard" });
    }
  });

  app.post("/api/onboarding", async (req, res) => {
    try {
      const { handleOnboardingAction } = await import("./src/routes/onboarding.server.js");
      const result = await handleOnboardingAction(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Onboarding failed" });
    }
  });

  app.get("/api/onboarding/welcome", async (req, res) => {
    try {
      const { userId, userName } = req.query;
      const { generateOnboardingWelcome } = await import("./src/routes/onboarding.server.js");
      const message = await generateOnboardingWelcome(userId as string, userName as string);
      res.json({ message });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Welcome failed" });
    }
  });

  app.get("/api/ai/context/:userId", async (req, res) => {
    try {
      const { getAIPromptContext } = await import("./src/services/ai_context.server.js");
      const context = await getAIPromptContext(req.params.userId);
      res.json({ context });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI context" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, message } = req.body;
      const { handleChatAction } = await import("./src/routes/api.chat.server.js");
      const response = await handleChatAction(userId, message);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Chat failed" });
    }
  });

  app.post("/api/save-strategy", async (req, res) => {
    try {
      const { saveStrategy } = await import("./src/routes/api.save-strategy.server.js");
      const result = await saveStrategy(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to save strategy" });
    }
  });

  app.post("/api/sync", async (req, res) => {
    try {
      const { userId } = req.body;
      const { syncFinancials } = await import("./src/routes/api.sync.server.js");
      const result = await syncFinancials(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Sync failed" });
    }
  });

  app.post("/api/export", async (req, res) => {
    try {
      const { userId } = req.body;
      const { generateFinancialRoadmap } = await import("./src/routes/api.export.server.js");
      const result = await generateFinancialRoadmap(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });

  app.get("/api/market-pulse", async (req, res) => {
    try {
      const { marketWatcher } = await import("./src/services/marketWatcher.server.js");
      const pulse = await marketWatcher.refreshMarketPulse();
      res.json(pulse);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh market pulse" });
    }
  });

  app.get("/api/annual-report", async (req, res) => {
    try {
      const { userId } = req.query;
      const { annualReportService } = await import("./src/routes/api.annual-report.js");
      const report = await annualReportService.generateUserReport(userId as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate annual report" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const { userId, aiResponse, userFeedback, context } = req.body;
      const { db } = await import("./src/lib/db.js");
      const { failedReasoning } = await import("./src/lib/schema.js");
      await db.insert(failedReasoning).values({
        userId,
        aiResponse,
        userFeedback,
        context,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  app.post("/api/log-advice", async (req, res) => {
    try {
      const { attributionLogger } = await import("./src/lib/ai/attribution.js");
      const result = await attributionLogger.logAdviceGiven(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to log advice" });
    }
  });

  app.post("/api/follow-advice", async (req, res) => {
    try {
      const { userId, adviceType } = req.body;
      const { attributionLogger } = await import("./src/lib/ai/attribution.js");
      await attributionLogger.markAsFollowed(userId, adviceType);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark advice as followed" });
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
    console.log(`🚀 DebtStrategist AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
