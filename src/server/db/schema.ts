// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, mysqlTableCreator } from "drizzle-orm/mysql-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = mysqlTableCreator((name) => `ricochet_${name}`);

export const users = createTable("users", (d) => ({
  id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
  username: d.varchar({ length: 256 }).notNull(),
  email: d.varchar({ length: 256 }).notNull(),
  createdAt: d
    .timestamp()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp().onUpdateNow(),
}));

export const pendingUsers = createTable("pending_users", (d) => ({
  id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
  username: d.varchar({ length: 256 }).notNull(),
  email: d.varchar({ length: 256 }).notNull(),
  token: d.varchar({ length: 64 }).notNull(),
  createdAt: d
    .timestamp()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp().onUpdateNow(),
}));

export const userVerificationCode = createTable(
  "user_verification_codes",
  (d) => ({
    id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
    token: d.varchar({ length: 256 }).notNull(),
    userId: d
      .bigint({ mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    used: d.boolean(),
    createdAt: d
      .timestamp()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp().onUpdateNow(),
  }),
);

export const sessions = createTable("sessions", (d) => ({
  id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
  token: d.varchar({ length: 256 }).notNull(),
  userId: d
    .bigint({ mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: d
    .timestamp()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const gameStates = ["lobby", "ingame", "ended"] as const;
export type GameState = (typeof gameStates)[number];

export const games = createTable("games", (d) => ({
  id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
  name: d.varchar({ length: 256 }).notNull(),
  code: d.varchar({ length: 64 }).notNull(),
  password: d.varchar({ length: 256 }),
  state: d.mysqlEnum("state", gameStates).notNull().default("lobby"),
  ownerId: d
    .bigint({ mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: d
    .timestamp()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp().onUpdateNow(),
}));

export const gameUsers = createTable("game_users", (d) => ({
  id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
  gameId: d
    .bigint({ mode: "number" })
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  userId: d
    .bigint({ mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: d
    .timestamp()
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp().onUpdateNow(),
}));
