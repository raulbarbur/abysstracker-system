"use client";

import { useState } from "react";
import { toggleProductStatus } from "@/actions/product-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";

export default function ProductActions({
  id,
  isActive,
  stock,
}: {
  id: string;
  isActive: boolean;
  stock: number;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initiateToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isActive && stock > 0) {
      addToast(
        "No se puede archivar un producto con stock. Realiza un retiro o ajuste a 0 primero.",
        "error",
      );
      return;
    }

    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    const res = await toggleProductStatus(id, isActive);

    if (res.error) {
      addToast(res.error, "error");
      throw new Error(res.error);
    } else {
      addToast(
        isActive ? "Producto archivado" : "Producto reactivado",
        "success",
      );
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex gap-2 justify-center">
        <Link
          href={`/products/${id}/edit`}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          EDITAR
        </Link>

        <button
          onClick={initiateToggle}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold border transition",
            isActive
              ? "border-destructive/30 text-destructive hover:bg-destructive/10"
              : "border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10",
          )}
        >
          {isActive ? "ARCHIVAR" : "ACTIVAR"}
        </button>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title={isActive ? "¿Archivar producto?" : "¿Reactivar producto?"}
        description={
          isActive
            ? "El producto dejará de estar visible en la caja y listados de venta, pero mantendrá su historial."
            : "El producto volverá a estar disponible para la venta inmediatamente."
        }
        confirmText={isActive ? "Sí, archivar" : "Sí, reactivar"}
        variant={isActive ? "destructive" : "default"}
      />
    </>
  );
}
