import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Botón de borrado con confirmación. Evita perder datos por un toque
 * accidental, que en móvil es fácil.
 */
export function ConfirmDelete({
  title,
  description,
  onConfirm,
  label = "Borrar",
  trigger,
  className,
}: {
  title: string;
  description?: string;
  onConfirm: () => void | Promise<unknown>;
  label?: string;
  trigger?: ReactNode;
  className?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={title}
            className={cn("p-1 text-muted-foreground", className)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
