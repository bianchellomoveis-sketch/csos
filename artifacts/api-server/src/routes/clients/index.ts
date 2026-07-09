import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, clientsTable, interactionsTable } from "@workspace/db";
import {
  ListClientsQueryParams,
  CreateClientBody,
  GetClientParams,
  UpdateClientParams,
  UpdateClientBody,
  DeleteClientParams,
  MarkClientSoldParams,
  MarkClientLostParams,
  RegenerateSuggestionParams,
  ImportClientHistoryParams,
  ImportClientHistoryBody,
  ListClientInteractionsParams,
  CreateClientInteractionParams,
  CreateClientInteractionBody,
} from "@workspace/api-zod";
import { computeAiFields, computePriorityScore, analyzeImportedText } from "../../lib/aiEngine";

const router: IRouter = Router();

type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

async function recalcAndSave(clientId: number, tx: DbOrTx = db) {
  const [client] = await tx.select().from(clientsTable).where(eq(clientsTable.id, clientId));
  if (!client) return undefined;

  const interactions = await tx
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.clientId, clientId))
    .orderBy(desc(interactionsTable.createdAt));

  const ai = computeAiFields(client, interactions);
  const priorityScore = computePriorityScore(ai.chancePurchase, ai.riskLoss, new Date(client.lastInteractionAt));

  const [updated] = await tx
    .update(clientsTable)
    .set({
      chancePurchase: ai.chancePurchase,
      riskLoss: ai.riskLoss,
      priority: ai.priority,
      nextAction: ai.nextAction,
      suggestedMessage: ai.suggestedMessage,
      strategicReason: ai.strategicReason,
      mainObjection: ai.mainObjection || client.mainObjection,
      priorityScore,
    })
    .where(eq(clientsTable.id, clientId))
    .returning();

  return updated;
}

router.get("/clients", async (req, res): Promise<void> => {
  const query = ListClientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const status = query.data.status;
  const whereClause = status && status !== "todos" ? eq(clientsTable.status, status) : undefined;

  const clients = await db
    .select()
    .from(clientsTable)
    .where(whereClause)
    .orderBy(desc(clientsTable.priorityScore));

  res.json(clients);
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date();
  const updated = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(clientsTable)
      .values({
        name: parsed.data.name,
        phone: parsed.data.phone,
        product: parsed.data.product ?? "",
        origin: parsed.data.origin ?? "",
        stage: parsed.data.stage ?? "Lead novo",
        temperature: parsed.data.temperature ?? "morno",
        status: parsed.data.status ?? "ativo",
        notes: parsed.data.notes ?? "",
        lastInteractionAt: now,
      })
      .returning();

    return (await recalcAndSave(created.id, tx)) ?? created;
  });

  res.status(201).json(updated);
});

router.get("/clients/summary", async (_req, res): Promise<void> => {
  const [row] = await db
    .select({
      totalActive: sql<number>`count(*) filter (where ${clientsTable.status} = 'ativo')`,
      totalSold: sql<number>`count(*) filter (where ${clientsTable.status} = 'vendido')`,
      totalLost: sql<number>`count(*) filter (where ${clientsTable.status} = 'perdido')`,
      criticalCount: sql<number>`count(*) filter (where ${clientsTable.status} = 'ativo' and ${clientsTable.priority} = 'critica')`,
      highChanceCount: sql<number>`count(*) filter (where ${clientsTable.status} = 'ativo' and ${clientsTable.chancePurchase} >= 70)`,
      contactedTodayCount: sql<number>`count(*) filter (where ${clientsTable.lastInteractionAt} >= date_trunc('day', now()))`,
    })
    .from(clientsTable);

  res.json({
    totalActive: Number(row?.totalActive ?? 0),
    totalSold: Number(row?.totalSold ?? 0),
    totalLost: Number(row?.totalLost ?? 0),
    criticalCount: Number(row?.criticalCount ?? 0),
    highChanceCount: Number(row?.highChanceCount ?? 0),
    contactedTodayCount: Number(row?.contactedTodayCount ?? 0),
  });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(client);
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
    if (!existing) return undefined;

    await tx.update(clientsTable).set(parsed.data).where(eq(clientsTable.id, params.data.id));

    return recalcAndSave(params.data.id, tx);
  });

  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(updated);
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const deleted = await db.transaction(async (tx) => {
    const [removed] = await tx.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
    if (!removed) return undefined;

    await tx.delete(interactionsTable).where(eq(interactionsTable.clientId, params.data.id));
    return removed;
  });

  if (!deleted) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/clients/:id/mark-sold", async (req, res): Promise<void> => {
  const params = MarkClientSoldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db
    .update(clientsTable)
    .set({ status: "vendido" })
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(updated);
});

router.post("/clients/:id/mark-lost", async (req, res): Promise<void> => {
  const params = MarkClientLostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db
    .update(clientsTable)
    .set({ status: "perdido" })
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(updated);
});

router.post("/clients/:id/regenerate-suggestion", async (req, res): Promise<void> => {
  const params = RegenerateSuggestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const updated = await recalcAndSave(params.data.id);
  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(updated);
});

router.post("/clients/:id/import-history", async (req, res): Promise<void> => {
  const params = ImportClientHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ImportClientHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
    if (!existing) return undefined;

    const analysis = analyzeImportedText(parsed.data.text);
    const now = new Date();

    await tx.insert(interactionsTable).values({
      clientId: params.data.id,
      type: "whatsapp",
      summary: analysis.summary,
      objection: analysis.objection,
      sentiment: analysis.sentiment,
    });

    await tx
      .update(clientsTable)
      .set({
        temperature: analysis.temperature,
        mainObjection: analysis.objection || existing.mainObjection,
        lastInteractionAt: now,
      })
      .where(eq(clientsTable.id, params.data.id));

    return recalcAndSave(params.data.id, tx);
  });

  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(updated);
});

router.get("/clients/:id/interactions", async (req, res): Promise<void> => {
  const params = ListClientInteractionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const interactions = await db
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.clientId, params.data.id))
    .orderBy(desc(interactionsTable.createdAt));

  res.json(interactions);
});

router.post("/clients/:id/interactions", async (req, res): Promise<void> => {
  const params = CreateClientInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateClientInteractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
    if (!existing) return undefined;

    const now = new Date();
    await tx.insert(interactionsTable).values({
      clientId: params.data.id,
      type: parsed.data.type,
      summary: parsed.data.summary,
      objection: parsed.data.objection ?? "",
      sentiment: parsed.data.sentiment,
    });

    await tx.update(clientsTable).set({ lastInteractionAt: now }).where(eq(clientsTable.id, params.data.id));

    return recalcAndSave(params.data.id, tx);
  });

  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.status(201).json(updated);
});

export default router;
