import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// In a real app, this would come from process.env.DATABASE_URL
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/debtstrategist';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
