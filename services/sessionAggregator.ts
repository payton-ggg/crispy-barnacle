import { statusRepository } from "../db/repositories/statusRepository";
import { sessionRepository } from "../db/repositories/sessionRepository";

const GAP_THRESHOLD_MINUTES = 3;

export class SessionAggregator {
  async processStatus(
    currentStatus: "online" | "offline",
    timestamp: Date
  ): Promise<void> {
    console.log(
      `📊 Processing status: ${currentStatus} at ${timestamp.toISOString()}`
    );

    const lastCheck = await statusRepository.getLatestStatus();
    const activeSession = await sessionRepository.getActiveSession();

    if (currentStatus === "online") {
      if (!activeSession) {
        // No active session, start new one
        console.log("🟢 Starting new session");
        await sessionRepository.createSession(timestamp);
      } else if (lastCheck?.status === "offline") {
        // Was offline, check gap
        const lastCheckTime = new Date(lastCheck.checked_at);
        const gapMinutes =
          (timestamp.getTime() - lastCheckTime.getTime()) / 60000;

        if (gapMinutes > GAP_THRESHOLD_MINUTES) {
          // Gap > 3 min, close old session and start new
          console.log(
            `⏸️  Gap of ${gapMinutes.toFixed(
              1
            )} min > ${GAP_THRESHOLD_MINUTES} min: closing session and starting new`
          );
          await sessionRepository.updateSession(
            activeSession.id,
            lastCheckTime
          );
          await sessionRepository.createSession(timestamp);
        } else {
          // Gap ≤ 3 min, continue session
          console.log(
            `⏩ Gap of ${gapMinutes.toFixed(
              1
            )} min ≤ ${GAP_THRESHOLD_MINUTES} min: continuing session`
          );
        }
      } else {
        // Still online, continue session
        console.log("🟢 Still online, continuing session");
      }
    } else {
      // Status is offline
      if (activeSession && lastCheck?.status === "online") {
        console.log("⚪️ User went offline, marking time");
      } else {
        console.log("⚪️ Still offline");
      }
      // Don't close session yet - will close only if next online > 3min gap
    }

    // Save status check
    await statusRepository.saveStatusCheck(currentStatus, timestamp);
  }

  async getCurrentStatus(): Promise<{
    status: "online" | "offline";
    since?: Date;
    lastSeen?: Date;
  }> {
    const lastCheck = await statusRepository.getLatestStatus();
    const activeSession = await sessionRepository.getActiveSession();

    if (!lastCheck) {
      return { status: "offline" };
    }

    if (lastCheck.status === "online" && activeSession) {
      return {
        status: "online",
        since: new Date(activeSession.session_start),
      };
    } else {
      return {
        status: "offline",
        lastSeen: new Date(lastCheck.checked_at),
      };
    }
  }

  async getStats(hours: number): Promise<{
    sessions: Array<{ start: Date; end: Date; duration: number }>;
    totalMinutes: number;
  }> {
    const sessions = await sessionRepository.getSessionsForPeriod(hours);

    const formattedSessions = sessions.map((s) => ({
      start: new Date(s.session_start),
      end: s.session_end ? new Date(s.session_end) : new Date(),
      duration: s.duration_minutes || 0,
    }));

    const totalMinutes = formattedSessions.reduce(
      (sum, s) => sum + s.duration,
      0
    );

    return {
      sessions: formattedSessions,
      totalMinutes,
    };
  }
}

export const sessionAggregator = new SessionAggregator();
