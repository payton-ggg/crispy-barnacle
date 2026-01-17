import TelegramBot from "node-telegram-bot-api";
import { sessionAggregator } from "../services/sessionAggregator";
import { getUserDisplayName } from "../mtproto/tracker";

export function setupCommands(bot: TelegramBot): void {
  // /status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const status = await sessionAggregator.getCurrentStatus();
      const userName = await getUserDisplayName();

      if (status.status === "online" && status.since) {
        const timeStr = status.since.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await bot.sendMessage(chatId, `🟢 ${userName} в сети с ${timeStr}`);
      } else if (status.lastSeen) {
        const timeStr = status.lastSeen.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await bot.sendMessage(
          chatId,
          `⚪️ ${userName} не в сети\nПоследний раз: ${timeStr}`
        );
      } else {
        await bot.sendMessage(chatId, `⚪️ ${userName} не в сети`);
      }
    } catch (error) {
      console.error("Error in /status command:", error);
      await bot.sendMessage(chatId, "❌ Ошибка при получении статуса");
    }
  });

  // /stats command with parameter (24/48/72)
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

      let message = `📊 Активность ${userName} за последние ${hours} часов\n\n`;

      if (stats.sessions.length === 0) {
        message += "Нет данных за этот период";
      } else {
        stats.sessions.forEach((session) => {
          const startStr = session.start.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const endStr = session.end.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });

          message += `${startStr} – ${endStr}\n`;
        });

        message += `\n✨ Всего онлайн: ${stats.totalMinutes} мин`;
      }

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error in /stats command:", error);
      await bot.sendMessage(chatId, "❌ Ошибка при получении статистики");
    }
  });

  // /stats without parameter - show usage
  bot.onText(/\/stats$/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      "📊 Использование:\n\n/stats 24 - за 24 часа\n/stats 48 - за 48 часов\n/stats 72 - за 72 часа"
    );
  });

  // /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `🤖 Доступные команды:\n\n` +
        `/status - текущий статус пользователя\n` +
        `/stats 24 - статистика за 24 часа\n` +
        `/stats 48 - статистика за 48 часов\n` +
        `/stats 72 - статистика за 72 часа\n` +
        `/help - показать эту справку`
    );
  });
}
