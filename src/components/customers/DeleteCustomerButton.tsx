"use client";

import { deleteCustomer } from "@/actions/customer-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  saleCount: number;
  isActive: boolean;
}

export function DeleteCustomerButton({ id, name, saleCount, isActive }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const isArchiving = isActive && saleCount > 0;
  const isRestoring = !isActive;

  const handleAction = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", id);

      if (isRestoring) {
        formData.append("restore", "true");
      }

      const result = await deleteCustomer(formData);

      if (result && "error" in result) {
        addToast(result.error, "error");
      } else {
        const message = isRestoring
          ? "Cliente restaurado"
          : isArchiving
            ? "Cliente archivado"
            : "Cliente eliminado";
        addToast(message, "success");
        router.refresh();
      }
    } catch (error) {
      addToast("Error al procesar la solicitud.", "error");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const getIcon = () => {
    if (loading) return <Icon name="loader" className="h-4 w-4 animate-spin" />;
    if (isRestoring) return <Icon name="sparkles" className="h-4 w-4" />;
    if (isArchiving) return <Icon name="close" className="h-4 w-4" />;
    return <Icon name="trash" className="h-4 w-4" />;
  };

  const getVariant = () => {
    if (isRestoring) return "default" as const;
    if (isArchiving) return "default" as const;
    return "destructive" as const;
  };

  const getTitle = () => {
    if (isRestoring) return `¿Restaurar a ${name}?`;
    if (isArchiving) return `¿Archivar a ${name}?`;
    return `¿Eliminar a ${name}?`;
  };

  const getDescription = () => {
    if (isRestoring)
      return "El cliente volverá a aparecer en la cartera activa y el buscador del POS.";
    if (isArchiving)
      return "El cliente tiene historial. No se borrará, pero ya no aparecerá en la cartera activa ni en el POS.";
    return "Esta acción es irreversible. El cliente se borrará permanentemente.";
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        disabled={loading}
        className={cn(
          "p-2 rounded-lg transition-colors",
          isRestoring
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
        )}
        title={
          isRestoring
            ? "Restaurar cliente"
            : isArchiving
              ? "Archivar (Tiene historial)"
              : "Eliminar permanentemente"
        }
      >
        {getIcon()}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleAction}
        title={getTitle()}
        description={getDescription()}
        confirmText={
          isRestoring
            ? "Sí, Restaurar"
            : isArchiving
              ? "Sí, Archivar"
              : "Sí, Eliminar"
        }
        variant={getVariant()}
      />
    </>
  );
}
