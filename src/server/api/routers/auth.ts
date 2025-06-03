import { z } from "zod";
import { generateToken } from "~/lib/generateToken";
import nodemailer from "nodemailer";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
  pendingUsers,
  sessions,
  users,
  userVerificationCode,
} from "~/server/db/schema";
import { eq, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

export const authRouter = createTRPCRouter({
  // hello: publicProcedure
  //   .input(z.object({ text: z.string() }))
  //   .query(({ input }) => {
  //     return {
  //       greeting: `Hello ${input.text}`,
  //     };
  //   }),
  // create: publicProcedure
  //   .input(z.object({ name: z.string().min(1) }))
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db.insert(posts).values({
  //       name: input.name,
  //     });
  //   }),
  login: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const queryUser = (
        await db.select().from(users).where(eq(users.email, input.email))
      )[0];

      if (!queryUser) {
        return {
          message:
            "A confirmation email has been sent to the provided address if an account exists.",
        };
      }

      const token = generateToken(64);
      await db.insert(userVerificationCode).values({
        userId: queryUser.id,
        token,
        used: false,
      });

      const mailOptions = {
        from: `"R3 by @dinkelspiel" <${process.env.GMAIL_EMAIL}>`,
        to: input.email,
        subject: "Verify Your R3 Account",
        text: `To log in to your R3 account, please click the following link: https://r3.keii.dev/api/auth/login?code=${token}. If you did not request this email, you can safely ignore it.`,
      };

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: env.GMAIL_EMAIL,
          pass: env.GMAIL_PASSWORD,
        },
      });

      transporter.sendMail(mailOptions);

      return {
        message:
          "A confirmation email has been sent to the provided address if an account exists.",
      };
    }),
  signUp: publicProcedure
    .input(
      z.object({
        username: z.string().regex(/^[A-Za-z0-9_]+$/, {
          message:
            "Username must only contain letters, numbers, and underscores",
        }),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const queryUser = await db
        .select()
        .from(users)
        .where(
          or(eq(users.email, input.email), eq(users.username, input.username)),
        );

      const queryPendingUser = await db
        .select()
        .from(pendingUsers)
        .where(
          or(
            eq(pendingUsers.email, input.email),
            eq(pendingUsers.username, input.username),
          ),
        );

      if (queryUser.length !== 0 || queryPendingUser.length !== 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already exists with this mail or username.",
        });
      }

      const insertedRow = await db.insert(pendingUsers).values({
        username: input.username,
        email: input.email,
        token: generateToken(64),
      });

      const pendingUser = (
        await db
          .select()
          .from(pendingUsers)
          .where(eq(pendingUsers.id, insertedRow[0].insertId))
      )[0];

      const mailOptions = {
        from: `"R3 by @dinkelspiel" <${process.env.GMAIL_EMAIL}>`,
        to: input.email,
        subject: "Signup to R3",
        text: `Create your R3 account by clicking this link: https://r3.keii.dev/api/auth/login?code=${pendingUser?.token}. If this wasn't sent by you then you can simply ignore it.`,
      };

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: env.GMAIL_EMAIL,
          pass: env.GMAIL_PASSWORD,
        },
      });

      transporter.sendMail(mailOptions);

      return {
        message:
          "A confirmation email has been sent to the provided address for account signup.",
      };
    }),
});
