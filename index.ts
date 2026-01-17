import * as dotenv from "dotenv";
import { initDatabase } from "./db";
import { initMTProtoClient } from "./mtproto/client";
import { checkUserStatus } from "./mtproto/tracker";
import { initBot } from "./bot/bot";
import { sessionAggregator } from "./services/sessionAggregator";
import { notifyOnline, shouldNotify } from "./services/notifier";
import { statusRepository } from "./db/repositories/statusRepository";

dotenv.config();

const MIN_POLL_INTERVAL = 60 * 1000; // 60 seconds
const MAX_POLL_INTERVAL = 120 * 1000; // 120 seconds

let isRunning = false;

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

    console.log(
      `\n⏰ ${timestamp.toLocaleString("ru-RU")} - Status: ${status}`
    );

    // Get last status for notification check
    const lastCheck = await statusRepository.getLatestStatus();
    const lastStatus = lastCheck?.status || null;

    // Process status through aggregator
    await sessionAggregator.processStatus(status, timestamp);

    // Send notification if needed
    if (await shouldNotify(status, lastStatus)) {
      await notifyOnline(timestamp);
    }
  } catch (error) {
    console.error("Error polling status:", error);
  }

  // Schedule next poll
  if (isRunning) {
    const nextInterval = getRandomInterval();
    console.log(`⏳ Next check in ${Math.round(nextInterval / 1000)} seconds`);
    setTimeout(pollStatus, nextInterval);
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting Telegram Status Tracker...\n");

  try {
    // Initialize database
    await initDatabase();

    // Initialize MTProto client
    await initMTProtoClient();

    // Initialize bot
    initBot();

    // Start polling
    isRunning = true;
    console.log("\n📡 Starting status polling...\n");
    await pollStatus();

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Shutting down gracefully...");
      isRunning = false;
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n\n🛑 Shutting down gracefully...");
      isRunning = false;
      process.exit(0);
    });
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Start the application
main();
