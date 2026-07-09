import { Client } from "@workspace/api-client-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClientMutations } from "@/hooks/use-client-mutations";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function DeleteConfirmDialog({ open, onOpenChange, client }: DeleteConfirmDialogProps) {
  const { deleteClient } = useClientMutations();

  const handleDelete = () => {
    if (client) {
      deleteClient.mutate({ id: client.id }, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-card-border max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Excluir Cliente</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-base">
            Tem certeza que deseja excluir o cliente <strong className="text-foreground">{client?.name}</strong> permanentemente?
            <br/><br/>
            Esta ação não pode ser desfeita e todo o histórico de interações será perdido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3">
          <AlertDialogCancel className="mt-0 h-12 bg-secondary border-border hover:bg-secondary/80">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            disabled={deleteClient.isPending}
          >
            {deleteClient.isPending ? "Excluindo..." : "Sim, excluir cliente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}