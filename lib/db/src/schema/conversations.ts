import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const conversationsTable = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),

    clientId: integer("client_id")
      .notNull()
      .references(() => clientsTable.id, { onDelete: "cascade" }),

    channel: text("channel").notNull().default("whatsapp"),

    provider: text("provider").notNull().default("waha"),

    externalChatId: text("external_chat_id").notNull().default(""),

    status: text("status").notNull().default("active"),

    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    clientChannelUnique: uniqueIndex(
      "conversations_client_channel_unique",
    ).on(table.clientId, table.channel),
  }),
);

export const insertConversationSchema = createInsertSchema(
  conversationsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<
  typeof insertConversationSchema
>;

export type Conversation =
  typeof conversationsTable.$inferSelect;