import "server-only";
import { auth } from "./auth";
import { db } from "./db";
import { HttpError } from "./http";

/** The signed-in user's id, or a 401 for API routes. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new HttpError(401, "Please sign in.");
  // A token can outlive its account (e.g. after deletion).
  const exists = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(401, "Please sign in.");
  return id;
}
