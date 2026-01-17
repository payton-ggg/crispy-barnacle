import TelegramBot from "node-telegram-bot-api";
import { sessionAggregator } from "../services/sessionAggregator";
import { getUserDisplayName } from "../mtproto/tracker";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function setupCommands(bot: TelegramBot): void {
  // /status - текущий статус
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const status = await sessionAggregator.getCurrentStatus();
      const userName = await getUserDisplayName();

      if (status.status === "online" && status.since) {
        const timeStr = formatTime(status.since);
        await bot.sendMessage(chatId, `🟢 ${userName} в сети с ${timeStr}`);
      } else if (status.lastSeen) {
        const timeStr = formatTime(status.lastSeen);
        await bot.sendMessage(
          chatId,
          `⚪️ ${userName} не в сети\nПоследний раз: ${timeStr}`
        );
      } else {
        await bot.sendMessage(chatId, `⚪️ ${userName} не в сети`);
      }
    } catch (error) {
      console.error("Error in /status:", error);
      await bot.sendMessage(chatId, "❌ Ошибка");
    }
  });

  // /stats <hours> - статистика
  bot.onText(/\/stats\s+(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const hours = parseInt(match![1]);

    if (![24, 48, 72].includes(hours)) {
      await bot.sendMessage(
        chatId,
        "❌ Используйте: /stats 24, /stats 48 или /stats 72"
      );
      return;
    }

    try {
      const stats = await sessionAggregator.getStats(hours);
      const userName = await getUserDisplayName();

      let message = `📊 Активность ${userName} за ${hours}ч\n\n`;

      if (stats.sessions.length === 0) {
        message += "⚪️ Нет данных";
      } else {
        let currentDate = "";

        stats.sessions.forEach((session) => {
          const sessionDate = formatDate(session.start);

          // Добавляем дату если новый день
          if (sessionDate !== currentDate) {
            if (currentDate !== "") message += "\n";
            message += `📅 ${sessionDate}\n`;
            currentDate = sessionDate;
          }

          const startStr = formatTime(session.start);
          const endStr = session.end ? formatTime(session.end) : "сейчас";

          message += `   ${startStr} – ${endStr}\n`;
        });

        const hours = Math.floor(stats.totalMinutes / 60);
        const mins = stats.totalMinutes % 60;

        message += `\n✨ Всего: `;
        if (hours > 0) {
          message += `${hours}ч ${mins}м`;
        } else {
          message += `${mins}м`;
        }
      }

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error in /stats:", error);
      await bot.sendMessage(chatId, "❌ Ошибка");
    }
  });

  // /stats без параметра
  bot.onText(/\/stats$/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      "📊 Использование:\n\n/stats 24 – за сутки\n/stats 48 – за 2 суток\n/stats 72 – за 3 суток"
    );
  });

  // /help
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `🤖 Команды:\n\n` +
        `/status – текущий статус\n` +
        `/stats 24 – статистика за сутки\n` +
        `/stats 48 – за 2 суток\n` +
        `/stats 72 – за 3 суток\n` +
        `/help – справка`
    );
  });
}
