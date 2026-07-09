import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, ClientInput, ClientStatus, ClientTemperature } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientMutations } from "@/hooks/use-client-mutations";
import { useEffect } from "react";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  product: z.string().min(1, "Produto é obrigatório"),
  origin: z.string().optional(),
  stage: z.string().optional(),
  temperature: z.enum(["frio", "morno", "quente"] as const).optional(),
  status: z.enum(["ativo", "vendido", "perdido"] as const).optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormSheet({ open, onOpenChange, client }: ClientFormSheetProps) {
  const { createClient, updateClient } = useClientMutations();
  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      product: "",
      origin: "",
      stage: "",
      temperature: "morno",
      status: "ativo",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && client) {
      form.reset({
        name: client.name,
        phone: client.phone,
        product: client.product || "",
        origin: client.origin || "",
        stage: client.stage || "",
        temperature: client.temperature || "morno",
        status: client.status || "ativo",
        notes: client.notes || "",
      });
    } else if (open && !client) {
      form.reset({
        name: "",
        phone: "",
        product: "",
        origin: "",
        stage: "Novo",
        temperature: "morno",
        status: "ativo",
        notes: "",
      });
    }
  }, [open, client, form]);

  const onSubmit = (values: ClientFormValues) => {
    if (isEditing) {
      updateClient.mutate({ id: client.id, data: values }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createClient.mutate({ data: values as ClientInput }, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const isPending = createClient.isPending || updateClient.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-full sm:right-0 sm:bottom-auto sm:top-0 sm:w-[400px] rounded-t-2xl sm:rounded-none overflow-y-auto border-border bg-background flex flex-col p-0">
        <div className="p-6 pb-2">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold">{isEditing ? "Editar Cliente" : "Novo Cliente"}</SheetTitle>
            <SheetDescription>
              {isEditing ? "Atualize as informações do lead." : "Cadastre uma nova oportunidade de venda."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Form {...form}>
            <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} className="bg-card border-card-border focus-visible:ring-primary h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp / Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 11 99999-9999" {...field} className="bg-card border-card-border focus-visible:ring-primary h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto de Interesse</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SUV 2024 Turbo" {...field} className="bg-card border-card-border focus-visible:ring-primary h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperatura</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-card border-card-border h-12">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="quente">Quente</SelectItem>
                          <SelectItem value="morno">Morno</SelectItem>
                          <SelectItem value="frio">Frio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etapa do Funil</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Negociação" {...field} className="bg-card border-card-border h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-card border-card-border h-12">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="vendido">Vendido</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Instagram" {...field} className="bg-card border-card-border h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Iniciais</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais..." 
                        className="resize-none bg-card border-card-border min-h-[100px]" 
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
            form="client-form" 
            className="w-full font-bold h-14 rounded-xl text-lg shadow-lg shadow-primary/20" 
            disabled={isPending}
          >
            {isPending ? "Salvando..." : "Salvar Lead"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}