import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq } from "drizzle-orm";

export const validateSessionTokenCookie = cache(async () => {
  const sessionToken = (await cookies()).get("rrSessionToken");

  if (sessionToken === null || sessionToken === undefined) {
    return null;
  }

  return await validateSessionToken(sessionToken.value);
});

export const validateSessionToken = cache(async (sessionToken: string) => {
  const session = (
    await db.select().from(sessions).where(eq(sessions.token, sessionToken))
  )[0];

  if (!session) {
    return null;
  }

  const user = (
    await db.select().from(users).where(eq(users.id, session.userId))
  )[0];

  return user ?? null;
});
