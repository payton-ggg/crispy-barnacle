import { db } from "../index";

export interface OnlineSession {
  id: number;
  session_start: string;
  last_seen: string;
  session_end: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export class SessionRepository {
  // Создать новую сессию
  async createSession(startTime: Date): Promise<number> {
    const result = await db.execute({
      sql: "INSERT INTO online_sessions (session_start, last_seen) VALUES (?, ?)",
      args: [startTime.toISOString(), startTime.toISOString()],
    });

    return Number(result.lastInsertRowid);
  }

  // Обновить last_seen для активной сессии (продлить сессию)
  async updateLastSeen(id: number, timestamp: Date): Promise<void> {
    await db.execute({
      sql: `UPDATE online_sessions 
            SET last_seen = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [timestamp.toISOString(), id],
    });
  }

  // Закрыть сессию
  async closeSession(id: number, endTime: Date): Promise<void> {
    // Get session start time
    const session = await db.execute({
      sql: "SELECT session_start FROM online_sessions WHERE id = ?",
      args: [id],
    });

    if (session.rows.length === 0) return;

    const startTime = new Date(session.rows[0].session_start as string);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    await db.execute({
      sql: `UPDATE online_sessions 
            SET session_end = ?, duration_minutes = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [endTime.toISOString(), durationMinutes, id],
    });
  }

  // Получить активную сессию (session_end IS NULL)
  async getActiveSession(): Promise<OnlineSession | null> {
    const result = await db.execute(
      "SELECT * FROM online_sessions WHERE session_end IS NULL ORDER BY session_start DESC LIMIT 1"
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id as number,
      session_start: row.session_start as string,
      last_seen: row.last_seen as string,
      session_end: row.session_end as string | null,
      duration_minutes: row.duration_minutes as number | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  // Получить завершенные сессии за период
  async getSessionsForPeriod(hours: number): Promise<OnlineSession[]> {
    const sinceTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    const result = await db.execute({
      sql: `SELECT * FROM online_sessions 
            WHERE session_start >= ? AND session_end IS NOT NULL 
            ORDER BY session_start ASC`,
      args: [sinceTime],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      session_start: row.session_start as string,
      last_seen: row.last_seen as string,
      session_end: row.session_end as string | null,
      duration_minutes: row.duration_minutes as number | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }));
  }

  // Получить все сессии за период (включая активную)
  async getAllSessionsForPeriod(hours: number): Promise<OnlineSession[]> {
    const sinceTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    const result = await db.execute({
      sql: `SELECT * FROM online_sessions 
            WHERE session_start >= ?
            ORDER BY session_start ASC`,
      args: [sinceTime],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      session_start: row.session_start as string,
      last_seen: row.last_seen as string,
      session_end: row.session_end as string | null,
      duration_minutes: row.duration_minutes as number | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }));
  }
}

export const sessionRepository = new SessionRepository();
