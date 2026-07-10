import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientMutations } from "@/hooks/use-client-mutations";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { BrainCircuit, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const interactionSchema = z.object({
  type: z.enum(["whatsapp", "ligacao", "loja", "proposta", "test_drive", "avaliacao", "retorno"] as const),
  summary: z.string().min(1, "O resumo é obrigatório"),
  objection: z.string().optional(),
  sentiment: z.enum(["positivo", "neutro", "negativo"] as const),
  notes: z.string().optional(),
  proposalSent: z.boolean().optional(),
  evaluationDone: z.boolean().optional(),
  testDriveDone: z.boolean().optional(),
  messageSent: z.string().optional(),
  clientResponse: z.string().optional(),
  importantChanges: z.string().optional(),
});

type InteractionFormValues = z.infer<typeof interactionSchema>;

interface InteractionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

const emptyDetails = {
  notes: "",
  proposalSent: false,
  evaluationDone: false,
  testDriveDone: false,
  messageSent: "",
  clientResponse: "",
  importantChanges: "",
};

export function InteractionFormSheet({ open, onOpenChange, client }: InteractionFormSheetProps) {
  const { createInteraction } = useClientMutations();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: "whatsapp",
      summary: "",
      objection: "",
      sentiment: "neutro",
      ...emptyDetails,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: "whatsapp",
        summary: "",
        objection: "",
        sentiment: "neutro",
        ...emptyDetails,
      });
      setDetailsOpen(false);
    }
  }, [open, form]);

  const onSubmit = (values: InteractionFormValues) => {
    if (!client) return;
    createInteraction.mutate({ 
      id: client.id, 
      data: values 
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  const isPending = createInteraction.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-full sm:right-0 sm:bottom-auto sm:top-0 sm:w-[400px] rounded-t-2xl sm:rounded-none overflow-y-auto border-border bg-background flex flex-col p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary" />
              Registrar Interação
            </SheetTitle>
            <SheetDescription>
              O Assistente Inteligente recalculará a prioridade e próxima ação do {client?.name} baseada nesta interação.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Form {...form}>
            <form id="interaction-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card border-card-border h-12">
                          <SelectValue placeholder="Selecione o canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                        <SelectItem value="loja">Visita à Loja</SelectItem>
                        <SelectItem value="test_drive">Test Drive</SelectItem>
                        <SelectItem value="proposta">Proposta Enviada</SelectItem>
                        <SelectItem value="avaliacao">Avaliação de Usado</SelectItem>
                        <SelectItem value="retorno">Retorno / Agendamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sentiment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentimento do Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card border-card-border h-12">
                          <SelectValue placeholder="Como ele reagiu?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="positivo" className="text-green-500 font-medium">😃 Positivo / Animado</SelectItem>
                        <SelectItem value="neutro">😐 Neutro / Pensativo</SelectItem>
                        <SelectItem value="negativo" className="text-red-500 font-medium">😠 Negativo / Resistente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo da Conversa</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="O que foi discutido? Qual o interesse atual?" 
                        className="resize-none bg-card border-card-border min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between">
                      <span>Objeção Atual</span>
                      <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Achou a parcela alta, esposa precisa aprovar..." 
                        className="bg-card border-card-border h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground py-1"
                  >
                    Mais detalhes (opcional)
                    <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-5 pt-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detalhes adicionais sobre a interação..."
                            className="resize-none bg-card border-card-border min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="messageSent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem enviada</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Copie aqui a mensagem enviada ao cliente"
                            className="resize-none bg-card border-card-border min-h-[70px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientResponse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resposta do cliente</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="O que o cliente respondeu?"
                            className="resize-none bg-card border-card-border min-h-[70px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="importantChanges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alterações importantes</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: mudou de orçamento, novo decisor..."
                            className="bg-card border-card-border h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-3">
                    <FormField
                      control={form.control}
                      name="proposalSent"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">Proposta enviada</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluationDone"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">Avaliação realizada</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="testDriveDone"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">Test drive realizado</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </form>
          </Form>
        </div>
        
        <div className="p-6 pt-4 border-t border-border mt-auto bg-card">
          <Button 
            type="submit" 
            form="interaction-form" 
            className="w-full font-bold h-14 rounded-xl text-lg shadow-lg shadow-primary/20" 
            disabled={isPending}
          >
            {isPending ? "Salvando..." : "Salvar Interação"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}