import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClientMutations } from "@/hooks/use-client-mutations";
import { useEffect } from "react";
import { MessageSquarePlus, Sparkles } from "lucide-react";

const importSchema = z.object({
  text: z.string().min(10, "Cole pelo menos um pequeno trecho da conversa"),
});

type ImportFormValues = z.infer<typeof importSchema>;

interface ImportHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ImportHistorySheet({ open, onOpenChange, client }: ImportHistorySheetProps) {
  const { importHistory } = useClientMutations();

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      text: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ text: "" });
    }
  }, [open, form]);

  const onSubmit = (values: ImportFormValues) => {
    if (!client) return;
    importHistory.mutate({ 
      id: client.id, 
      data: values 
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  const isPending = importHistory.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-full sm:right-0 sm:bottom-auto sm:top-0 sm:w-[500px] rounded-t-2xl sm:rounded-none overflow-y-auto border-border bg-background flex flex-col p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6 text-primary" />
              Importar WhatsApp
            </SheetTitle>
            <SheetDescription>
              Cole o histórico da conversa com {client?.name}. O Assistente Inteligente irá ler, resumir, extrair objeções e atualizar a estratégia.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Form {...form}>
            <form id="import-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
              
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-2 flex gap-3 text-sm text-primary-foreground items-start">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <p>O Assistente Inteligente analisará o texto (com regras locais) e atualizará temperatura, objeções e chance de compra automaticamente.</p>
              </div>

              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Cole o texto da conversa (Ctrl+C / Ctrl+V do WhatsApp Web)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="[10:30, 15/10/2023] Cliente: Olá, gostaria de saber mais sobre o SUV...&#10;[10:35, 15/10/2023] Vendedor: Claro! Ele está na promoção..." 
                        className="flex-1 resize-none bg-card border-card-border font-mono text-xs p-4" 
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
        
        <div className="p-6 pt-4 border-t border-border mt-auto">
          <Button 
            type="submit" 
            form="import-form" 
            className="w-full font-bold h-14 rounded-xl text-lg shadow-lg shadow-primary/20" 
            disabled={isPending}
          >
            {isPending ? "Analisando..." : "Gerar sugestão"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}