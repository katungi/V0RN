import "server-only";
import { chat } from "./schema";
import { db } from "../db-client";

// biome-ignore lint: Forbidden non-null assertion.

export async function createChat({
  userId,
  title,
  visibility = "private",
}: {
  userId: string;
  title: string;
  visibility?: "public" | "private";
}) {
  try {
    return await db.insert(chat).values({
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    console.error("Failed to create chat in database:", error);
    throw error;
  }
}
