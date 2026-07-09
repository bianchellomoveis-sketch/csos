import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  useMarkClientSold,
  useMarkClientLost,
  useRegenerateSuggestion,
  useImportClientHistory,
  useCreateClientInteraction,
  getListClientsQueryKey,
  getGetClientQueryKey,
  getListClientInteractionsQueryKey,
  getGetClientsSummaryQueryKey
} from "@workspace/api-client-react";

export function useClientMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetClientsSummaryQueryKey() });
  };

  const invalidateClient = (id: number) => {
    queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
    invalidateLists();
  };

  const createClient = useCreateClient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cliente adicionado", description: "O novo lead foi registrado com sucesso." });
        invalidateLists();
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível adicionar o cliente.", variant: "destructive" });
      }
    }
  });

  const updateClient = useUpdateClient({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Cliente atualizado", description: "As informações foram salvas." });
        invalidateClient(data.id);
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível atualizar o cliente.", variant: "destructive" });
      }
    }
  });

  const deleteClient = useDeleteClient({
    mutation: {
      onSuccess: (_, variables) => {
        toast({ title: "Cliente excluído", description: "O registro foi removido permanentemente." });
        queryClient.removeQueries({ queryKey: getGetClientQueryKey(variables.id) });
        invalidateLists();
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" });
      }
    }
  });

  const markSold = useMarkClientSold({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Venda registrada! 🎉", description: "Excelente trabalho. A meta está mais próxima." });
        invalidateClient(data.id);
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
      }
    }
  });

  const markLost = useMarkClientLost({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Venda perdida", description: "Cliente marcado como perdido." });
        invalidateClient(data.id);
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
      }
    }
  });

  const regenerateSuggestion = useRegenerateSuggestion({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Sugestão atualizada", description: "A inteligência artificial gerou uma nova recomendação." });
        invalidateClient(data.id);
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível gerar nova sugestão.", variant: "destructive" });
      }
    }
  });

  const importHistory = useImportClientHistory({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Histórico importado", description: "O contexto do cliente foi atualizado com IA." });
        invalidateClient(data.id);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao processar o histórico do WhatsApp.", variant: "destructive" });
      }
    }
  });

  const createInteraction = useCreateClientInteraction({
    mutation: {
      onSuccess: (_, variables) => {
        toast({ title: "Interação registrada", description: "O contato foi salvo e a estratégia atualizada." });
        // The API recalculates fields on the client, so we must invalidate the client to fetch those new fields
        invalidateClient(variables.id);
        queryClient.invalidateQueries({ queryKey: getListClientInteractionsQueryKey(variables.id) });
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível registrar a interação.", variant: "destructive" });
      }
    }
  });

  return {
    createClient,
    updateClient,
    deleteClient,
    markSold,
    markLost,
    regenerateSuggestion,
    importHistory,
    createInteraction
  };
}