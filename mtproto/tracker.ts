import { Api } from "telegram";
import { getMTProtoClient } from "./client";
import * as dotenv from "dotenv";

dotenv.config();

const targetUser = process.env.TARGET_USER!;

export async function checkUserStatus(): Promise<"online" | "offline"> {
  try {
    const client = getMTProtoClient();

    // Get user entity
    const user = (await client.getEntity(targetUser)) as Api.User;

    // Check status
    if (user.status instanceof Api.UserStatusOnline) {
      return "online";
    } else {
      return "offline";
    }
  } catch (error) {
    console.error("Error checking user status:", error);
    throw error;
  }
}

export async function getUserDisplayName(): Promise<string> {
  try {
    const client = getMTProtoClient();
    const user = (await client.getEntity(targetUser)) as Api.User;

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.username) {
      return `@${user.username}`;
    } else {
      return "User";
    }
  } catch (error) {
    console.error("Error getting user display name:", error);
    return targetUser;
  }
}
