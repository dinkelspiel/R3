import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateToken } from "~/lib/generateToken";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { games, gameUsers } from "~/server/db/schema";

export const gameRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const insertedGame = await db.insert(games).values({
        name: input.name,
        password: input.password,
        state: "lobby",
        code: generateToken(64),
        ownerId: ctx.user.id,
      });
      const game = (
        await db
          .select()
          .from(games)
          .where(eq(games.id, insertedGame[0].insertId))
      )[0];
      await db.insert(gameUsers).values({
        gameId: game!.id,
        userId: ctx.user.id,
      });
      return game!.code;
    }),
  getGamesInLobby: publicProcedure.query(async ({ ctx }) => {
    return await db.select().from(games).where(eq(games.state, "lobby"));
  }),
});
