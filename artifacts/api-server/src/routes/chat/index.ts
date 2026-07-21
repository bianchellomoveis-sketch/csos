import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  clientsTable,
  conversationsTable,
  messagesTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/chat/health", (_req, res) => {
  res.json({
    status: "ok",
    module: "chat",
  });
});

router.post("/chat/clients/:clientId/conversation", async (req, res) => {
  const clientId = Number(req.params.clientId);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    res.status(400).json({
      error: "Invalid client id",
    });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId));

  if (!client) {
    res.status(404).json({
      error: "Client not found",
    });
    return;
  }

  const [existingConversation] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.clientId, clientId),
        eq(conversationsTable.channel, "whatsapp"),
      ),
    );

  if (existingConversation) {
    res.json(existingConversation);
    return;
  }

  const [createdConversation] = await db
    .insert(conversationsTable)
    .values({
      clientId,
      channel: "whatsapp",
      provider: "waha",
      status: "active",
    })
    .returning();

  res.status(201).json(createdConversation);
});

router.get(
  "/chat/conversations/:conversationId/messages",
  async (req, res) => {
    const conversationId = Number(req.params.conversationId);

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      res.status(400).json({
        error: "Invalid conversation id",
      });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      res.status(404).json({
        error: "Conversation not found",
      });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(asc(messagesTable.createdAt));

    res.json(messages);
  },
);
router.post(
  "/chat/conversations/:conversationId/messages",
  async (req, res) => {
    const conversationId = Number(req.params.conversationId);

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      res.status(400).json({
        error: "Invalid conversation id",
      });
      return;
    }

    const body = req.body as {
      direction?: unknown;
      type?: unknown;
      content?: unknown;
      externalMessageId?: unknown;
      mediaUrl?: unknown;
      status?: unknown;
    };

    if (
      body.direction !== "inbound" &&
      body.direction !== "outbound"
    ) {
      res.status(400).json({
        error: "Direction must be inbound or outbound",
      });
      return;
    }

    const direction: "inbound" | "outbound" = body.direction;
    
    const type =
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim()
        : "text";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (type === "text" && !content) {
      res.status(400).json({
        error: "Text message content is required",
      });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      res.status(404).json({
        error: "Conversation not found",
      });
      return;
    }

    const now = new Date();

    const createdMessage = await db.transaction(async (tx) => {
      const [message] = await tx
        .insert(messagesTable)
        .values({
          conversationId,
          externalMessageId:
            typeof body.externalMessageId === "string" &&
            body.externalMessageId.trim()
              ? body.externalMessageId.trim()
              : `manual-${randomUUID()}`,
          direction,
          type,
          content,
          mediaUrl:
            typeof body.mediaUrl === "string"
              ? body.mediaUrl.trim()
              : "",
          status:
            typeof body.status === "string" &&
            body.status.trim()
              ? body.status.trim()
              : direction === "outbound"
                ? "pending"
                : "received",
          sentAt: now,
        })
        .returning();

      await tx
        .update(conversationsTable)
        .set({
          lastMessageAt: now,
        })
        .where(eq(conversationsTable.id, conversationId));

      return message;
    });

    res.status(201).json(createdMessage);
  },
);
export default router;