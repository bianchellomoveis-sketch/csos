import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { conversationsTable } from "./conversations";

export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),

    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, {
        onDelete: "cascade",
      }),

    externalMessageId: text("external_message_id").notNull().default(""),

    direction: text("direction").notNull(),

    type: text("type").notNull().default("text"),

    content: text("content").notNull().default(""),

    mediaUrl: text("media_url").notNull().default(""),

    status: text("status").notNull().default("pending"),

    sentAt: timestamp("sent_at", {
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
    externalMessageUnique: uniqueIndex("messages_external_message_unique").on(
      table.externalMessageId,
    ),

    conversationCreatedAtIndex: index(
      "messages_conversation_created_at_idx",
    ).on(table.conversationId, table.createdAt),
  }),
);

export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Message = typeof messagesTable.$inferSelect;
