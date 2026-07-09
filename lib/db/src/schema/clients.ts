import { pgTable, serial, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  product: text("product").notNull().default(""),
  origin: text("origin").notNull().default(""),
  stage: text("stage").notNull().default("Lead novo"),
  temperature: text("temperature").notNull().default("morno"),
  status: text("status").notNull().default("ativo"),
  notes: text("notes").notNull().default(""),
  mainObjection: text("main_objection").notNull().default(""),
  nextAction: text("next_action").notNull().default(""),
  suggestedMessage: text("suggested_message").notNull().default(""),
  strategicReason: text("strategic_reason").notNull().default(""),
  chancePurchase: integer("chance_purchase").notNull().default(50),
  riskLoss: integer("risk_loss").notNull().default(30),
  priority: text("priority").notNull().default("media"),
  priorityScore: doublePrecision("priority_score").notNull().default(0),
  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;

export const interactionsTable = pgTable("interactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  type: text("type").notNull(),
  summary: text("summary").notNull().default(""),
  objection: text("objection").notNull().default(""),
  sentiment: text("sentiment").notNull().default("neutro"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInteractionSchema = createInsertSchema(interactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactionsTable.$inferSelect;
