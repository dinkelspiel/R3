import { type NextRequest } from "next/server";
import { generateToken } from "../../../../lib/generateToken";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import {
  pendingUsers,
  sessions,
  users,
  userVerificationCode,
} from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { Verify } from "crypto";
export const GET = async (request: NextRequest) => {
  const sp = request.nextUrl.searchParams;
  const token = sp.get("code");
  if (token) {
    const pendingUser = (
      await db.select().from(pendingUsers).where(eq(pendingUsers.token, token))
    )[0];
    const verificationCode = (
      await db
        .select()
        .from(userVerificationCode)
        .where(
          and(
            eq(userVerificationCode.token, token),
            eq(userVerificationCode.used, false),
          ),
        )
    )[0];

    const cookie = await cookies();
    if (pendingUser) {
      const insertedUser = await db.insert(users).values({
        email: pendingUser.email,
        username: pendingUser.username,
      });

      await db.delete(pendingUsers).where(eq(pendingUsers.id, pendingUser.id));

      const token = generateToken(64);
      await db.insert(sessions).values({
        token,
        userId: insertedUser[0].insertId,
      });

      cookie.set("rrSessionToken", token);
      return redirect("/");
    } else if (verificationCode) {
      const token = generateToken(64);
      await db.insert(sessions).values({
        token,
        userId: verificationCode.userId,
      });
      await db
        .update(userVerificationCode)
        .set({ used: true })
        .where(eq(userVerificationCode.id, verificationCode.id));

      cookie.set("rrSessionToken", token);
      return redirect("/");
    }
    return redirect("/?error=Invalid or used verification code");
  }
};
