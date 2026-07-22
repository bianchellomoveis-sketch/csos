import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  clientsTable,
  conversationsTable,
  messagesTable,
} from "@workspace/db";
import { WAHAService } from "../../lib/waha/WAHAService";

const router: IRouter = Router();

const wahaService = new WAHAService();

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

let externalMessageId =
  typeof body.externalMessageId === "string" &&
  body.externalMessageId.trim()
    ? body.externalMessageId.trim()
    : `manual-${randomUUID()}`;

let messageStatus =
  typeof body.status === "string" && body.status.trim()
    ? body.status.trim()
    : direction === "outbound"
      ? "pending"
      : "received";

if (direction === "outbound" && process.env.WAHA_BASE_URL) {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, conversation.clientId));

  if (!client) {
    res.status(404).json({
      error: "Client not found",
    });
    return;
  }

  try {
    const wahaResponse = await wahaService.sendText({
      phone: client.phone,
      text: content,
    });

    externalMessageId =
      typeof wahaResponse.id === "string" && wahaResponse.id
        ? wahaResponse.id
        : `waha-${randomUUID()}`;

    messageStatus = "sent";
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "WAHA message sending failed",
    });
    return;
  }
}

const createdMessage = await db.transaction(async (tx) => {
  const [message] = await tx
    .insert(messagesTable)
    .values({
      conversationId,
      externalMessageId,
      direction,
      type,
      content,
      mediaUrl:
        typeof body.mediaUrl === "string"
          ? body.mediaUrl.trim()
          : "",
      status: messageStatus,
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