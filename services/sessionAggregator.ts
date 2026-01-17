import { sessionRepository } from "../db/repositories/sessionRepository";

const GAP_THRESHOLD_MINUTES = 3;

export class SessionAggregator {
  private lastStatus: "online" | "offline" | null = null;
  private lastOfflineTime: Date | null = null;

  async processStatus(
    currentStatus: "online" | "offline",
    timestamp: Date
  ): Promise<void> {
    console.log(
      `📊 [${timestamp.toLocaleTimeString("ru-RU")}] Status: ${currentStatus}`
    );

    const activeSession = await sessionRepository.getActiveSession();

    if (currentStatus === "online") {
      if (!activeSession) {
        // Нет активной сессии → создать новую
        const sessionId = await sessionRepository.createSession(timestamp);
        console.log(`🟢 Новая сессия #${sessionId} начата`);
      } else if (this.lastStatus === "offline" && this.lastOfflineTime) {
        // Был offline, проверяем гэп
        const gapMinutes =
          (timestamp.getTime() - this.lastOfflineTime.getTime()) / 60000;

        if (gapMinutes <= GAP_THRESHOLD_MINUTES) {
          // Гэп ≤ 3 мин → продолжаем сессию
          await sessionRepository.updateLastSeen(activeSession.id, timestamp);
          console.log(
            `⏩ Сессия #${
              activeSession.id
            } продолжена (гэп ${gapMinutes.toFixed(1)} мин)`
          );
        } else {
          // Гэп > 3 мин → закрываем старую, создаем новую
          await sessionRepository.closeSession(
            activeSession.id,
            this.lastOfflineTime
          );
          const sessionId = await sessionRepository.createSession(timestamp);
          console.log(
            `⏸️  Сессия #${activeSession.id} закрыта (гэп ${gapMinutes.toFixed(
              1
            )} мин)`
          );
          console.log(`🟢 Новая сессия #${sessionId} начата`);
        }
      } else {
        // Все еще online → обновляем last_seen
        await sessionRepository.updateLastSeen(activeSession.id, timestamp);
        console.log(`🟢 Сессия #${activeSession.id} активна`);
      }
    } else {
      // Статус offline
      if (activeSession && this.lastStatus === "online") {
        console.log(
          `⚪️ Пользователь offline (сессия #${activeSession.id} ожидает)`
        );
      }
      this.lastOfflineTime = timestamp;
    }

    this.lastStatus = currentStatus;
  }

  async getCurrentStatus(): Promise<{
    status: "online" | "offline";
    since?: Date;
    lastSeen?: Date;
  }> {
    const activeSession = await sessionRepository.getActiveSession();

    if (activeSession && this.lastStatus === "online") {
      return {
        status: "online",
        since: new Date(activeSession.session_start),
      };
    } else if (activeSession) {
      return {
        status: "offline",
        lastSeen: new Date(activeSession.last_seen),
      };
    } else {
      return {
        status: "offline",
        lastSeen: this.lastOfflineTime || undefined,
      };
    }
  }

  async getStats(hours: number): Promise<{
    sessions: Array<{ start: Date; end: Date | null; duration: number | null }>;
    totalMinutes: number;
  }> {
    const sessions = await sessionRepository.getAllSessionsForPeriod(hours);

    const formattedSessions = sessions.map((s) => ({
      start: new Date(s.session_start),
      end: s.session_end ? new Date(s.session_end) : null,
      duration: s.duration_minutes,
    }));

    const totalMinutes = formattedSessions.reduce((sum, s) => {
      if (s.duration !== null) {
        return sum + s.duration;
      } else if (s.end === null) {
        // Активная сессия - считаем до сейчас
        const now = new Date();
        const duration = Math.round(
          (now.getTime() - s.start.getTime()) / 60000
        );
        return sum + duration;
      }
      return sum;
    }, 0);

    return {
      sessions: formattedSessions,
      totalMinutes,
    };
  }
}

export const sessionAggregator = new SessionAggregator();
