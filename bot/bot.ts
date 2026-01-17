import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
import { setupCommands } from "./commands";
import { initNotifier } from "../services/notifier";

dotenv.config();

const token = process.env.BOT_TOKEN!;

export let bot: TelegramBot;

export function initBot(): TelegramBot {
  console.log("🤖 Initializing Telegram bot...");

  bot = new TelegramBot(token, { polling: true });

  // Setup commands
  setupCommands(bot);

  // Initialize notifier
  initNotifier(bot);

  // Handle /start to help users get their chat ID
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `👋 Привет!\n\nВаш Chat ID: \`${chatId}\`\n\nДобавьте его в .env как NOTIFICATION_CHAT_ID для получения уведомлений.`,
      { parse_mode: "Markdown" }
    );
  });

  console.log("✅ Telegram bot ready");

  return bot;
}

export function getBot(): TelegramBot {
  if (!bot) {
    throw new Error("Bot not initialized");
  }
  return bot;
}
