import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const apiId = parseInt(process.env.API_ID!);
const apiHash = process.env.API_HASH!;
const stringSession = new StringSession(""); // Empty for first run

export let client: TelegramClient;

// Helper for user input
function input(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function initMTProtoClient(): Promise<TelegramClient> {
  console.log("🔐 Initializing MTProto client...");

  client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input("Enter your phone number: "),
    password: async () => await input("Enter your 2FA password (if enabled): "),
    phoneCode: async () => await input("Enter the code you received: "),
    onError: (err) => console.error("MTProto error:", err),
  });

  console.log("✅ MTProto client connected");
  console.log("📝 Session string (save this for next time):");
  console.log(client.session.save());

  return client;
}

export function getMTProtoClient(): TelegramClient {
  if (!client) {
    throw new Error("MTProto client not initialized");
  }
  return client;
}
