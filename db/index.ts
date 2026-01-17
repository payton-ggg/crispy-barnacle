import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

export const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_API_KEY!,
});

export async function initDatabase() {
  console.log("🗄️  Initializing database...");

  // Create status_checks table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS status_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checked_at TIMESTAMP NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('online', 'offline')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_status_checks_checked_at 
    ON status_checks(checked_at)
  `);

  // Create online_sessions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS online_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_start TIMESTAMP NOT NULL,
      session_end TIMESTAMP,
      duration_minutes INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_online_sessions_start 
    ON online_sessions(session_start)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_online_sessions_end 
    ON online_sessions(session_end)
  `);

  console.log("✅ Database initialized");
}
