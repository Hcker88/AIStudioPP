import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  GEMINI_API_KEY: z.string().min(1),
  PORT: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
