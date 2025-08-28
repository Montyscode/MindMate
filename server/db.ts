import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Check if we have a database connection
const hasDatabaseUrl = !!process.env.DATABASE_URL;

if (hasDatabaseUrl) {
  neonConfig.webSocketConstructor = ws;
}

let pool: Pool | null = null;
let db: any = null;

if (hasDatabaseUrl) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("Database connection established");
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }
} else {
  console.log("No DATABASE_URL provided - running without database");
}

export { pool, db };