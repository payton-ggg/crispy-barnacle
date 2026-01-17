import TelegramBot from "node-telegram-bot-api";
import { getUserDisplayName } from "../mtproto/tracker";
import * as dotenv from "dotenv";

dotenv.config();

let bot: TelegramBot | null = null;

export function initNotifier(botInstance: TelegramBot): void {
  bot = botInstance;
}

export async function notifyOnline(timestamp: Date): Promise<void> {
  if (!bot) {
    console.log("⚠️  Notifier not initialized");
    return;
  }

  const chatId = process.env.NOTIFICATION_CHAT_ID;
  if (!chatId) {
    console.log("⚠️  NOTIFICATION_CHAT_ID not set in .env");
    return;
  }

  try {
    const userName = await getUserDisplayName();
    const timeStr = timestamp.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await bot.sendMessage(
      chatId,
      `👤 ${userName} появился в сети (${timeStr})`
    );

    console.log(`🔔 Notification sent to ${chatId}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export async function shouldNotify(
  currentStatus: "online" | "offline",
  lastStatus: "online" | "offline" | null
): Promise<boolean> {
  // Notify only when status changes from offline to online
  return currentStatus === "online" && lastStatus === "offline";
}
