import type { Client, Interaction } from "@workspace/api-client-react";
import { CalendarClock, MessageCircle, Phone, Store, FileText, Car, ClipboardCheck } from "lucide-react";

interface ClientTimelineProps {
  client: Client;
  interactions: Interaction[] | undefined;
}

const typeLabel: Record<string, string> = {
  whatsapp: "Primeiro WhatsApp",
  ligacao: "Ligação",
  loja: "Visita à Loja",
  proposta: "Proposta",
  test_drive: "Test Drive",
  avaliacao: "Avaliação",
  retorno: "Retorno / Agendamento",
};

const typeIcon: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  ligacao: Phone,
  loja: Store,
  proposta: FileText,
  test_drive: Car,
  avaliacao: ClipboardCheck,
  retorno: CalendarClock,
};

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const SEM_CONTATO_THRESHOLD_DAYS = 5;

/**
 * Timeline is derived on the frontend from the client record + existing
 * interactions list -- no new endpoint/table needed. Adds a synthetic
 * "Sem contato" marker when the client has gone quiet for a while.
 */
export function ClientTimeline({ client, interactions }: ClientTimelineProps) {
  const sorted = [...(interactions ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const events: { date: Date; label: string; icon: typeof MessageCircle; muted?: boolean }[] = [
    { date: new Date(client.createdAt), label: "Lead criado", icon: CalendarClock },
    ...sorted.map((i) => ({
      date: new Date(i.createdAt),
      label: typeLabel[i.type] ?? i.type,
      icon: typeIcon[i.type] ?? MessageCircle,
    })),
  ];

  const daysSinceLast = Math.floor((Date.now() - new Date(client.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLast >= SEM_CONTATO_THRESHOLD_DAYS) {
    events.push({ date: new Date(), label: "Sem contato", icon: CalendarClock, muted: true });
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = event.icon;
        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${event.muted ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {idx < events.length - 1 && <div className="w-px flex-1 bg-border my-0.5" />}
            </div>
            <div className={`pb-4 ${event.muted ? "text-muted-foreground" : ""}`}>
              <p className="text-xs font-semibold text-muted-foreground">{formatDate(event.date)}</p>
              <p className="text-sm font-medium">{event.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
