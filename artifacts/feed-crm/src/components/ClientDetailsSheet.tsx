import { Client, useListClientInteractions, getListClientInteractionsQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, Zap, StickyNote, Phone, Tag, UserCircle2, History, ListChecks, Clock, Target } from "lucide-react";
import { getPriorityColor, getTemperatureColor } from "@/lib/format";
import { ClientTimeline } from "./ClientTimeline";

interface ClientDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ClientDetailsSheet({ open, onOpenChange, client }: ClientDetailsSheetProps) {
  const { data: interactions } = useListClientInteractions(client?.id ?? 0, {
    query: { enabled: open && !!client, queryKey: getListClientInteractionsQueryKey(client?.id ?? 0) },
  });

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-full sm:right-0 sm:bottom-auto sm:top-0 sm:w-[440px] rounded-t-2xl sm:rounded-none overflow-y-auto border-border bg-background flex flex-col p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold">{client.name}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`capitalize font-semibold ${getTemperatureColor(client.temperature)}`}>
                {client.temperature}
              </Badge>
              <Badge variant="outline" className={`capitalize font-semibold ${getPriorityColor(client.priority)}`}>
                {client.priority} prioridade
              </Badge>
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Produto
              </p>
              <p className="text-sm font-medium text-foreground">{client.product || "Não informado"}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Telefone
              </p>
              <p className="text-sm font-medium text-foreground">{client.phone}</p>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Origem / Etapa</p>
            <p className="text-sm font-medium text-foreground">{client.origin || "Sem origem"} · {client.stage || "Sem etapa"}</p>
          </div>

          {client.notes && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <StickyNote className="h-4 w-4" /> Observações
              </p>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          {client.mainObjection && (
            <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-destructive mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Objeção Principal
              </p>
              <p className="text-sm text-foreground/90">{client.mainObjection}</p>
            </div>
          )}

          {client.intelligentProfile && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <UserCircle2 className="h-4 w-4" /> Perfil Inteligente
              </p>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{client.intelligentProfile}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {client.strategy && (
              <div className="bg-card border border-card-border rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Estratégia
                </p>
                <p className="text-sm font-medium text-foreground">{client.strategy}</p>
              </div>
            )}
            {client.bestContactTime && (
              <div className="bg-card border border-card-border rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Melhor momento
                </p>
                <p className="text-sm font-medium text-foreground">{client.bestContactTime}</p>
              </div>
            )}
          </div>

          {client.urgency && (
            <Badge variant="outline" className="capitalize font-semibold">
              Urgência: {client.urgency}
            </Badge>
          )}

          {client.strategicReason && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Por que o Assistente Inteligente sugere isso
              </p>
              <p className="text-sm text-foreground/90">{client.strategicReason}</p>
            </div>
          )}

          {client.analysisContext && client.analysisContext.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" /> Como cheguei nessa conclusão
              </p>
              <ul className="space-y-1">
                {client.analysisContext.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground/85 flex gap-2">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {client.suggestedMessage && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Zap className="h-4 w-4" /> Mensagem sugerida completa
              </p>
              <p className="text-sm text-foreground/90 italic whitespace-pre-wrap">"{client.suggestedMessage}"</p>
            </div>
          )}

          <div className="bg-card border border-card-border rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <History className="h-4 w-4" /> Linha do Tempo
            </p>
            <ClientTimeline client={client} interactions={interactions} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
