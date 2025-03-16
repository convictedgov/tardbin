import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  avatarUrl: text("avatar_url"),
});

export const pastes = pgTable("pastes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  urlId: text("url_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  password: text("password"),
  isPinned: boolean("is_pinned").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPasteSchema = createInsertSchema(pastes)
  .pick({
    title: true,
    content: true,
    isPrivate: true,
    password: true,
  })
  .extend({
    password: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPaste = z.infer<typeof insertPasteSchema>;
export type User = typeof users.$inferSelect;
export type Paste = typeof pastes.$inferSelect;
