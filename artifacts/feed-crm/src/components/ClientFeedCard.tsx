import { Client } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Phone,
  MessageCircle,
  MoreVertical,
  Edit2,
  CheckCircle2,
  XCircle,
  Trash2,
  Sparkles,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  MessageSquarePlus,
  History,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  cleanPhone,
  formatTimeAgo,
  getPriorityColor,
  getTemperatureColor,
  getTimeAgoColor,
} from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { useClientMutations } from "@/hooks/use-client-mutations";

interface ClientFeedCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onRegisterInteraction: (client: Client) => void;
  onImportHistory: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewDetails: (client: Client) => void;
  onViewHistory: (client: Client) => void;
  onOpenChat: (client: Client) => void;
  isActive?: boolean;
}

export function ClientFeedCard({
  client,
  onEdit,
  onRegisterInteraction,
  onImportHistory,
  onDelete,
  onViewDetails,
  onViewHistory,
  onOpenChat,
  isActive = false,
}: ClientFeedCardProps) {
  const { markSold, markLost, regenerateSuggestion } = useClientMutations();

  const handleLigar = () => {
    const phone = cleanPhone(client.phone);
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = () => {
    const phone = cleanPhone(client.phone);
    if (!phone) return;
    const msg = encodeURIComponent(client.suggestedMessage || "Olá!");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="w-full h-[var(--feed-card-height)] flex-shrink-0 snap-start snap-always flex flex-col p-4">
      <Card
        className={`relative w-full h-full flex flex-col overflow-hidden transition-all duration-300 ${isActive ? "scale-100 opacity-100 shadow-2xl shadow-primary/10 border-primary/30" : "scale-[0.98] opacity-70"} bg-card border-card-border`}
      >
        {/* Subtle darkened car background */}
        <div
          className="absolute inset-0 opacity-[0.10] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: "url(/card-bg-car.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-card/60 via-card/85 to-card pointer-events-none" />

        {/* Header - Identidade e Status */}
        <div className="relative flex justify-between items-start p-4 pb-2 shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight truncate">
              {client.name}
            </h2>
            <p className="text-muted-foreground text-xs font-medium truncate">
              {client.product || "Sem produto"}
            </p>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <Badge
              variant="outline"
              className={`capitalize font-bold border rounded-full px-2 py-0.5 text-[11px] ${getTemperatureColor(client.temperature)}`}
            >
              {client.temperature}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-popover border-border"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(client)}
                  className="gap-2 cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" /> Editar cliente
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onImportHistory(client)}
                  className="gap-2 cursor-pointer"
                >
                  <MessageSquarePlus className="h-4 w-4" /> Importar histórico
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => markSold.mutate({ id: client.id })}
                  className="gap-2 text-success focus:text-success cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Vendido
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => markLost.mutate({ id: client.id })}
                  className="gap-2 text-warning focus:text-warning cursor-pointer"
                >
                  <XCircle className="h-4 w-4" /> Marcar como Perdido
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => onDelete(client)}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Excluir permanentemente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Score compacto */}
        <div className="relative px-4 py-1.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col flex-1 gap-1">
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Chance
              </span>
              <span className="text-primary">{client.chancePurchase}%</span>
            </div>
            <Progress
              value={client.chancePurchase}
              className="h-1 bg-primary/20"
              indicatorClassName="bg-primary"
            />
          </div>
          <div className="flex flex-col flex-1 gap-1">
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Risco
              </span>
              <span className="text-destructive">{client.riskLoss}%</span>
            </div>
            <Progress
              value={client.riskLoss}
              className="h-1 bg-destructive/20"
              indicatorClassName="bg-destructive"
            />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="relative flex gap-1.5 px-4 py-2 flex-wrap shrink-0">
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold rounded-md border ${getTimeAgoColor(client.lastInteractionAt)}`}
          >
            {formatTimeAgo(client.lastInteractionAt)}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[11px] capitalize font-semibold rounded-md border ${getPriorityColor(client.priority)}`}
          >
            {client.priority}
          </Badge>
          {client.stage && (
            <Badge
              variant="secondary"
              className="text-[11px] font-semibold rounded-md bg-secondary text-secondary-foreground"
            >
              {client.stage}
            </Badge>
          )}
        </div>

        {/* Main Content Area - fixed, no internal scroll */}
        <div className="relative flex-1 px-4 py-1 flex flex-col gap-2 min-h-0 overflow-hidden">
          {client.mainObjection && (
            <div className="bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Objeção Principal
              </p>
              <p className="text-xs font-medium text-foreground/90 truncate">
                {client.mainObjection}
              </p>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-1.5 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Ação · Assistente
                Inteligente
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1 text-primary hover:bg-primary/10 rounded-full shrink-0 text-[11px] font-semibold"
                onClick={() => regenerateSuggestion.mutate({ id: client.id })}
                disabled={regenerateSuggestion.isPending}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${regenerateSuggestion.isPending ? "animate-spin" : ""}`}
                />
                {regenerateSuggestion.isPending
                  ? "Gerando..."
                  : "Gerar sugestão"}
              </Button>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug mb-2 line-clamp-2">
              {client.nextAction ||
                "Nenhuma ação recomendada no momento. Registre uma interação."}
            </p>

            {client.suggestedMessage && (
              <div className="mt-auto bg-card rounded-md p-2.5 border border-border">
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Sugestão de mensagem:
                </p>
                <p className="text-xs text-foreground/80 italic line-clamp-2">
                  "{client.suggestedMessage}"
                </p>
                <button
                  type="button"
                  onClick={() => onViewDetails(client)}
                  className="text-[11px] font-semibold text-primary mt-1 flex items-center gap-0.5 hover:underline"
                >
                  Ver mensagem completa <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom of card */}
        <div className="relative p-4 pt-2 shrink-0">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold h-11 rounded-xl shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => onOpenChat(client)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button
              variant="secondary"
              className="w-full font-bold h-11 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all active:scale-95 border border-border"
              onClick={handleLigar}
            >
              <Phone className="mr-2 h-4 w-4" />
              Ligar
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="w-full font-semibold h-10 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-xs px-1"
              onClick={() => onRegisterInteraction(client)}
            >
              Registrar
            </Button>
            <Button
              variant="outline"
              className="w-full font-semibold h-10 rounded-xl border-border text-foreground hover:bg-secondary transition-all text-xs px-1"
              onClick={() => onViewHistory(client)}
            >
              <History className="mr-1 h-3.5 w-3.5" /> Histórico
            </Button>
            <Button
              variant="outline"
              className="w-full font-semibold h-10 rounded-xl border-border text-foreground hover:bg-secondary transition-all text-xs px-1"
              onClick={() => onViewDetails(client)}
            >
              Detalhes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
