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
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { BrainCircuit } from "lucide-react";

const interactionSchema = z.object({
  type: z.enum(["whatsapp", "ligacao", "loja", "proposta", "test_drive", "avaliacao", "retorno"] as const),
  summary: z.string().min(1, "O resumo é obrigatório"),
  objection: z.string().optional(),
  sentiment: z.enum(["positivo", "neutro", "negativo"] as const),
});

type InteractionFormValues = z.infer<typeof interactionSchema>;

interface InteractionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function InteractionFormSheet({ open, onOpenChange, client }: InteractionFormSheetProps) {
  const { createInteraction } = useClientMutations();

  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: "whatsapp",
      summary: "",
      objection: "",
      sentiment: "neutro",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: "whatsapp",
        summary: "",
        objection: "",
        sentiment: "neutro",
      });
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
              A IA recalculará a prioridade e próxima ação do {client?.name} baseada nesta interação.
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
            {isPending ? "Processando..." : "Salvar e Atualizar IA"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}