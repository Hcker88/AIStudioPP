import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  APP_URL: z.string().url().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  get DATABASE_URL() { if (!parsed.DATABASE_URL) throw new Error('DATABASE_URL is not set'); return parsed.DATABASE_URL; },
  get GOOGLE_CLIENT_ID() { if (!parsed.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not set'); return parsed.GOOGLE_CLIENT_ID; },
  get GOOGLE_CLIENT_SECRET() { if (!parsed.GOOGLE_CLIENT_SECRET) throw new Error('GOOGLE_CLIENT_SECRET is not set'); return parsed.GOOGLE_CLIENT_SECRET; },
  get SESSION_SECRET() { return parsed.SESSION_SECRET || 'fallback-dev-secret-only'; },
  get GEMINI_API_KEY() { if (!parsed.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set'); return parsed.GEMINI_API_KEY; },
  PORT: parsed.PORT,
  NODE_ENV: parsed.NODE_ENV,
  APP_URL: parsed.APP_URL,
};
