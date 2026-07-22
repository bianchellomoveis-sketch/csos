import { useEffect, useState } from "react";
import type { Client } from "@workspace/api-client-react";
import { Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface ChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

interface Conversation {
  id: number;
  clientId: number;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  direction: "inbound" | "outbound";
  type: string;
  content: string;
  status: string;
  createdAt: string;
}

export function ChatSheet({ open, onOpenChange, client }: ChatSheetProps) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !client) return;

    const loadConversation = async () => {
      setIsLoading(true);
      setError("");

      try {
        const conversationResponse = await fetch(
          `/api/chat/clients/${client.id}/conversation`,
          {
            method: "POST",
          },
        );

        if (!conversationResponse.ok) {
          throw new Error("Não foi possível abrir a conversa.");
        }

        const conversation =
          (await conversationResponse.json()) as Conversation;

        setConversationId(conversation.id);

        const messagesResponse = await fetch(
          `/api/chat/conversations/${conversation.id}/messages`,
        );

        if (!messagesResponse.ok) {
          throw new Error("Não foi possível carregar as mensagens.");
        }

        const loadedMessages = (await messagesResponse.json()) as ChatMessage[];

        setMessages(loadedMessages);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao abrir o chat.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadConversation();
  }, [open, client]);

  const handleSendMessage = async () => {
    const content = messageText.trim();

    if (!conversationId || !content || isSending) return;

    setIsSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            direction: "outbound",
            type: "text",
            content,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível salvar a mensagem.");
      }

      const createdMessage = (await response.json()) as ChatMessage;

      setMessages((currentMessages) => [...currentMessages, createdMessage]);
      setMessageText("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Erro ao enviar a mensagem.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{client?.name ?? "Chat"}</SheetTitle>
          <SheetDescription>
            Conversa interna vinculada ao cliente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando conversa...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhuma mensagem nesta conversa.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.direction === "outbound"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">
                    {message.status}
                  </p>
                </div>
              ))}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-end gap-2 border-t border-border pt-3">
          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Digite uma mensagem..."
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          <Button
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
