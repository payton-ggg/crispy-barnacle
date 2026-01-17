import * as dotenv from "dotenv";
import { initDatabase } from "./db";
import { initMTProtoClient } from "./mtproto/client";
import { checkUserStatus } from "./mtproto/tracker";
import { initBot } from "./bot/bot";
import { sessionAggregator } from "./services/sessionAggregator";
import { notifyOnline, shouldNotify } from "./services/notifier";

import http from "http";

function startHttpServer() {
  const port = Number(process.env.PORT) || 8080;

  http
    .createServer((_, res) => {
      res.writeHead(200);
      res.end("OK");
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`🌐 HTTP server listening on ${port}`);
    });
}

dotenv.config();

const MIN_POLL_INTERVAL = 60 * 1000; // 60 seconds
const MAX_POLL_INTERVAL = 120 * 1000; // 120 seconds

let isRunning = false;
let lastNotifiedStatus: "online" | "offline" | null = null;

function getRandomInterval(): number {
  return Math.floor(
    Math.random() * (MAX_POLL_INTERVAL - MIN_POLL_INTERVAL) + MIN_POLL_INTERVAL
  );
}

async function pollStatus(): Promise<void> {
  if (!isRunning) return;

  try {
    const timestamp = new Date();
    const status = await checkUserStatus();

    // Обработка статуса
    await sessionAggregator.processStatus(status, timestamp);

    // Отправка уведомления при переходе offline → online
    if (await shouldNotify(status, lastNotifiedStatus)) {
      await notifyOnline(timestamp);
    }
    lastNotifiedStatus = status;
  } catch (error) {
    console.error("❌ Error polling status:", error);
  }

  // Следующая проверка
  if (isRunning) {
    const nextInterval = getRandomInterval();
    console.log(
      `⏳ Следующая проверка через ${Math.round(nextInterval / 1000)} сек\n`
    );
    setTimeout(pollStatus, nextInterval);
  }
}

async function main(): Promise<void> {
  console.log("🚀 Telegram Status Tracker\n");

  try {
    startHttpServer();

    await initDatabase();

    await initMTProtoClient();

    initBot();

    // Старт polling
    isRunning = true;
    console.log("\n📡 Мониторинг запущен\n");
    console.log("━".repeat(50));
    await pollStatus();

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Остановка...");
      isRunning = false;
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n\n🛑 Остановка...");
      isRunning = false;
      process.exit(0);
    });
  } catch (error) {
    console.error("💥 Критическая ошибка:", error);
    process.exit(1);
  }
}

main();
