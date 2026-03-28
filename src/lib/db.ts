import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    // prepare: false is required for Supabase transaction pooler (port 6543)
    const client = postgres(connectionString, { prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
};

// For backward compatibility where db is imported directly
// This will throw if DATABASE_URL is missing when the file is loaded
// so we use a proxy to delay initialization until it's actually used
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    return (getDb() as any)[prop];
  }
});
