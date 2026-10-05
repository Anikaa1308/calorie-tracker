import "server-only";
import { db } from "./db";

/**
 * The signed-in user's id. Until accounts land this is a single local demo
 * user, so the logging experience works end to end.
 */
export const DEMO_USER_ID = "demo-user";

let ensured = false;

export async function requireUserId(): Promise<string> {
  if (!ensured) {
    await db.user.upsert({
      where: { id: DEMO_USER_ID },
      create: { id: DEMO_USER_ID, email: "demo@plate.local", name: "Demo" },
      update: {},
    });
    ensured = true;
  }
  return DEMO_USER_ID;
}
