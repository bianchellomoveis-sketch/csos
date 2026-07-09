import { Client, ClientStatus, ClientTemperature } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Phone, MessageCircle, MoreVertical, Edit2, CheckCircle2, 
  XCircle, Trash2, BrainCircuit, RefreshCw, Zap, TrendingUp, AlertTriangle, MessageSquarePlus
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cleanPhone, formatTimeAgo, getPriorityColor, getTemperatureColor, getTimeAgoColor } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { useClientMutations } from "@/hooks/use-client-mutations";

interface ClientFeedCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onRegisterInteraction: (client: Client) => void;
  onImportHistory: (client: Client) => void;
  onDelete: (client: Client) => void;
  isActive?: boolean;
}

export function ClientFeedCard({ 
  client, 
  onEdit, 
  onRegisterInteraction, 
  onImportHistory, 
  onDelete,
  isActive = false
}: ClientFeedCardProps) {
  const { markSold, markLost, regenerateSuggestion } = useClientMutations();
  
  const handleWhatsApp = () => {
    const phone = cleanPhone(client.phone);
    if (!phone) return;
    const msg = encodeURIComponent(client.suggestedMessage || "Olá!");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const handleLigar = () => {
    const phone = cleanPhone(client.phone);
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="w-full h-[var(--feed-card-height)] flex-shrink-0 snap-start snap-always flex flex-col p-4">
      <Card className={`w-full h-full flex flex-col overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-2xl shadow-primary/10 border-primary/30' : 'scale-[0.98] opacity-70'} bg-card border-card-border`}>
        
        {/* Header - Identidade e Status */}
        <div className="flex justify-between items-start p-5 pb-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">{client.name}</h2>
            <p className="text-muted-foreground text-sm font-medium">{client.product || "Sem produto"}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className={`capitalize font-bold border rounded-full px-2.5 py-0.5 text-xs ${getTemperatureColor(client.temperature)}`}>
              {client.temperature}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                <DropdownMenuItem onClick={() => onEdit(client)} className="gap-2 cursor-pointer">
                  <Edit2 className="h-4 w-4" /> Editar cliente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onImportHistory(client)} className="gap-2 cursor-pointer">
                  <MessageSquarePlus className="h-4 w-4" /> Importar histórico
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => markSold.mutate({ id: client.id })} className="gap-2 text-success focus:text-success cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Vendido
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => markLost.mutate({ id: client.id })} className="gap-2 text-warning focus:text-warning cursor-pointer">
                  <XCircle className="h-4 w-4" /> Marcar como Perdido
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => onDelete(client)} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                  <Trash2 className="h-4 w-4" /> Excluir permanentemente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dashboard de IA e Score */}
        <div className="px-5 py-2 flex items-center justify-between gap-4">
          <div className="flex flex-col flex-1 gap-1.5">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Chance de Venda</span>
              <span className="text-primary">{client.chancePurchase}%</span>
            </div>
            <Progress value={client.chancePurchase} className="h-1.5 bg-primary/20" indicatorClassName="bg-primary" />
          </div>
          <div className="flex flex-col flex-1 gap-1.5">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Risco de Perda</span>
              <span className="text-destructive">{client.riskLoss}%</span>
            </div>
            <Progress value={client.riskLoss} className="h-1.5 bg-destructive/20" indicatorClassName="bg-destructive" />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2 px-5 py-3">
          <Badge variant="outline" className={`font-semibold rounded-md border ${getTimeAgoColor(client.lastInteractionAt)}`}>
            {formatTimeAgo(client.lastInteractionAt)}
          </Badge>
          <Badge variant="outline" className={`capitalize font-semibold rounded-md border ${getPriorityColor(client.priority)}`}>
            {client.priority} Prioridade
          </Badge>
          {client.stage && (
            <Badge variant="secondary" className="font-semibold rounded-md bg-secondary text-secondary-foreground">
              {client.stage}
            </Badge>
          )}
        </div>

        {/* Main Content Area - Scrollable se necessário, mas idealmente fixo */}
        <div className="flex-1 px-5 py-2 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {/* Objeção */}
          {client.mainObjection && (
            <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Objeção Principal
              </p>
              <p className="text-sm font-medium text-foreground/90">{client.mainObjection}</p>
            </div>
          )}

          {/* Ação Recomendada */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Zap className="h-4 w-4 fill-primary/20" /> Ação Recomendada IA
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full" 
                onClick={() => regenerateSuggestion.mutate({ id: client.id })}
                disabled={regenerateSuggestion.isPending}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${regenerateSuggestion.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-lg font-medium text-foreground leading-snug mb-3">
              {client.nextAction || "Nenhuma ação recomendada no momento. Registre uma interação."}
            </p>
            
            {client.suggestedMessage && (
              <div className="mt-auto bg-card rounded-lg p-3 border border-border relative group">
                <p className="text-xs font-medium text-muted-foreground mb-1">Sugestão de mensagem:</p>
                <p className="text-sm text-foreground/80 italic line-clamp-3">"{client.suggestedMessage}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom of card */}
        <div className="p-5 pt-3 mt-auto">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Button 
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold h-12 rounded-xl shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-95"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
            <Button 
              variant="secondary"
              className="w-full font-bold h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all active:scale-95 border border-border"
              onClick={handleLigar}
            >
              <Phone className="mr-2 h-5 w-5" />
              Ligar
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="w-full font-bold h-12 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
            onClick={() => onRegisterInteraction(client)}
          >
            <BrainCircuit className="mr-2 h-5 w-5" />
            Registrar Interação & Atualizar IA
          </Button>
        </div>

      </Card>
    </div>
  );
}