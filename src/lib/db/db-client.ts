import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema/schema';

declare global {
  var db: ReturnType<typeof createDb> | undefined;
}

const createDb = () => {
  return drizzle(sql, { schema });
};

// Use a singleton pattern to prevent multiple instances in development
export const db = global.db || (global.db = createDb());
