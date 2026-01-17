import { db } from "../index";

export interface StatusCheck {
  id: number;
  checked_at: string;
  status: "online" | "offline";
  created_at: string;
}

export class StatusRepository {
  async saveStatusCheck(
    status: "online" | "offline",
    timestamp: Date
  ): Promise<void> {
    await db.execute({
      sql: "INSERT INTO status_checks (checked_at, status) VALUES (?, ?)",
      args: [timestamp.toISOString(), status],
    });
  }

  async getLatestStatus(): Promise<StatusCheck | null> {
    const result = await db.execute(
      "SELECT * FROM status_checks ORDER BY checked_at DESC LIMIT 1"
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id as number,
      checked_at: row.checked_at as string,
      status: row.status as "online" | "offline",
      created_at: row.created_at as string,
    };
  }

  async getStatusHistory(hours: number): Promise<StatusCheck[]> {
    const sinceTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    const result = await db.execute({
      sql: "SELECT * FROM status_checks WHERE checked_at >= ? ORDER BY checked_at ASC",
      args: [sinceTime],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      checked_at: row.checked_at as string,
      status: row.status as "online" | "offline",
      created_at: row.created_at as string,
    }));
  }
}

export const statusRepository = new StatusRepository();
