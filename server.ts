import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieSession from "cookie-session";
import rateLimit from 'express-rate-limit';
import { logger } from "./src/server/config/logger";
import { errorHandler } from "./src/server/middleware/error";
import apiRouter from "./src/server/routes/api";
import { env } from "./src/lib/env.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = parseInt(env.PORT, 10) || 3000;

  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieSession({
    name: 'session',
    keys: [env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none',
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);

  // Routes
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (env.NODE_ENV !== "production") {
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

  // Error handler
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 DebtStrategist AI Server running on port ${PORT}`);
  });
}

startServer();
