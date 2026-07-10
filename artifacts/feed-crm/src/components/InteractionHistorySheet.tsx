import { Client, useListClientInteractions, getListClientInteractionsQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { History, MessageCircle, Phone, Store, FileText, Car, ClipboardCheck, CalendarClock } from "lucide-react";
import { formatTimeAgo } from "@/lib/format";

interface InteractionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

const typeMeta: Record<string, { label: string; icon: typeof MessageCircle }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  ligacao: { label: "Ligação", icon: Phone },
  loja: { label: "Visita à Loja", icon: Store },
  proposta: { label: "Proposta Enviada", icon: FileText },
  test_drive: { label: "Test Drive", icon: Car },
  avaliacao: { label: "Avaliação de Usado", icon: ClipboardCheck },
  retorno: { label: "Retorno / Agendamento", icon: CalendarClock },
};

const sentimentColor: Record<string, string> = {
  positivo: "text-green-500 bg-green-500/10 border-green-500/20",
  neutro: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  negativo: "text-red-500 bg-red-500/10 border-red-500/20",
};

export function InteractionHistorySheet({ open, onOpenChange, client }: InteractionHistorySheetProps) {
  const { data: interactions, isLoading } = useListClientInteractions(client?.id ?? 0, {
    query: { enabled: open && !!client, queryKey: getListClientInteractionsQueryKey(client?.id ?? 0) },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-full sm:right-0 sm:bottom-auto sm:top-0 sm:w-[420px] rounded-t-2xl sm:rounded-none overflow-y-auto border-border bg-background flex flex-col p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Histórico de {client?.name}
            </SheetTitle>
            <SheetDescription>Todas as interações registradas com este cliente.</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : !interactions || interactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <History className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhuma interação registrada ainda.</p>
            </div>
          ) : (
            interactions.map((interaction) => {
              const meta = typeMeta[interaction.type] ?? { label: interaction.type, icon: MessageCircle };
              const Icon = meta.icon;
              return (
                <div key={interaction.id} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Icon className="h-4 w-4 text-primary" /> {meta.label}
                    </span>
                    <Badge variant="outline" className={`text-xs capitalize ${sentimentColor[interaction.sentiment] ?? ""}`}>
                      {interaction.sentiment}
                    </Badge>
                  </div>
                  {interaction.summary && (
                    <p className="text-sm text-foreground/80 mb-2">{interaction.summary}</p>
                  )}
                  {interaction.objection && (
                    <p className="text-xs text-destructive/90 mb-2">Objeção: {interaction.objection}</p>
                  )}
                  {interaction.notes && (
                    <p className="text-xs text-foreground/70 mb-2">Obs: {interaction.notes}</p>
                  )}
                  {(interaction.proposalSent || interaction.evaluationDone || interaction.testDriveDone) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {interaction.proposalSent && <Badge variant="outline" className="text-[10px]">Proposta enviada</Badge>}
                      {interaction.evaluationDone && <Badge variant="outline" className="text-[10px]">Avaliação feita</Badge>}
                      {interaction.testDriveDone && <Badge variant="outline" className="text-[10px]">Test drive feito</Badge>}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(interaction.createdAt)}</p>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
