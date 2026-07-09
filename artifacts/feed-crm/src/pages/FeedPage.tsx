import { useState, useRef, useEffect } from "react";
import { useListClients, Client, ClientStatusFilter } from "@workspace/api-client-react";
import { ClientFeedCard } from "@/components/ClientFeedCard";
import { ClientFormSheet } from "@/components/forms/ClientFormSheet";
import { InteractionFormSheet } from "@/components/forms/InteractionFormSheet";
import { ImportHistorySheet } from "@/components/forms/ImportHistorySheet";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, UserX } from "lucide-react";

export default function FeedPage() {
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("ativo");
  
  const { data: clients, isLoading, error } = useListClients({ status: statusFilter });
  
  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [activeClient, setActiveClient] = useState<Client | null>(null);

  // Focus tracking para efeitos premium
  const [visibleCardId, setVisibleCardId] = useState<number | null>(null);

  const handleEdit = (client: Client) => {
    setActiveClient(client);
    setFormOpen(true);
  };

  const handleNew = () => {
    setActiveClient(null);
    setFormOpen(true);
  };

  const handleInteraction = (client: Client) => {
    setActiveClient(client);
    setInteractionOpen(true);
  };

  const handleImport = (client: Client) => {
    setActiveClient(client);
    setImportOpen(true);
  };

  const handleDelete = (client: Client) => {
    setActiveClient(client);
    setDeleteOpen(true);
  };

  // Setup observer elements for feed cards to detect which one is mostly visible
  useEffect(() => {
    if (clients && clients.length > 0 && !visibleCardId) {
      setVisibleCardId(clients[0].id);
    }
  }, [clients]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden w-full h-[100dvh]">
      {/* App Header & Tabs */}
      <header className="z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 shrink-0">
        <div className="flex flex-col px-4 pt-4 pb-2 gap-3 max-w-[600px] mx-auto w-full">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Feed CRM
            </h1>
            <div className="flex gap-2">
              <Button size="icon" className="rounded-full h-10 w-10 shadow-lg shadow-primary/20 transition-transform active:scale-95" onClick={handleNew}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatusFilter)} className="w-full">
            <TabsList className="w-full h-12 bg-card border border-card-border rounded-xl grid grid-cols-4 p-1">
              <TabsTrigger value="ativo" className="rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Ativos
              </TabsTrigger>
              <TabsTrigger value="vendido" className="rounded-lg font-semibold data-[state=active]:bg-success data-[state=active]:text-success-foreground transition-all">
                Vendidos
              </TabsTrigger>
              <TabsTrigger value="perdido" className="rounded-lg font-semibold data-[state=active]:bg-muted data-[state=active]:text-muted-foreground transition-all">
                Perdidos
              </TabsTrigger>
              <TabsTrigger value="todos" className="rounded-lg font-semibold data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all">
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Feed Content - Snap Scrolling Container */}
      <main className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-background w-full max-w-[600px] mx-auto pb-4 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <UserX className="h-16 w-16 mb-4 text-destructive/50" />
            <p className="text-lg font-medium">Erro ao carregar clientes</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <UserX className="h-20 w-20 mb-6 text-muted-foreground/30" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum cliente</h3>
            <p className="text-base max-w-[250px] mb-8">
              Sua lista de clientes {statusFilter !== 'todos' ? `com status "${statusFilter}"` : ''} está vazia.
            </p>
            <Button size="lg" className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20" onClick={handleNew}>
              <Plus className="mr-2 h-5 w-5" /> Cadastrar Lead
            </Button>
          </div>
        ) : (
          <div className="w-full h-full">
            {clients.map((client) => (
              <FeedCardWrapper 
                key={client.id}
                client={client}
                onVisible={(id) => setVisibleCardId(id)}
                isActive={visibleCardId === client.id}
              >
                <ClientFeedCard 
                  client={client}
                  onEdit={handleEdit}
                  onRegisterInteraction={handleInteraction}
                  onImportHistory={handleImport}
                  onDelete={handleDelete}
                  isActive={visibleCardId === client.id}
                />
              </FeedCardWrapper>
            ))}
            
            <div className="h-32 snap-start flex items-center justify-center text-muted-foreground font-medium text-sm">
              Você chegou ao fim do feed.
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile / Alternate Entry */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden block">
        <Button 
          size="icon" 
          className="h-16 w-16 rounded-full shadow-[0_0_30px_rgba(var(--primary),0.5)] border-2 border-primary-foreground/20 hover:scale-105 active:scale-95 transition-all"
          onClick={handleNew}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>

      {/* Modals */}
      <ClientFormSheet 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        client={activeClient} 
      />
      <InteractionFormSheet 
        open={interactionOpen} 
        onOpenChange={setInteractionOpen} 
        client={activeClient} 
      />
      <ImportHistorySheet 
        open={importOpen} 
        onOpenChange={setImportOpen} 
        client={activeClient} 
      />
      <DeleteConfirmDialog 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        client={activeClient} 
      />
    </div>
  );
}

// Helper wrapper to detect when a card scrolls into view
function FeedCardWrapper({ 
  client, 
  children, 
  onVisible, 
  isActive 
}: { 
  client: Client; 
  children: React.ReactNode; 
  onVisible: (id: number) => void;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            onVisible(client.id);
          }
        });
      },
      { threshold: [0.5, 0.8] }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [client.id, onVisible]);

  return (
    <div ref={ref} className="w-full h-[var(--feed-card-height)] shrink-0">
      {children}
    </div>
  );
}