"use client";

import { useState } from "react";
import { cancelSale } from "@/actions/sale-actions";
import { ConfirmModal } from "./ui/ConfirmModal";
import { useToast } from "./ui/Toast";

export default function CancelSaleButton({ saleId }: { saleId: string }) {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const handleCancel = async () => {
    setLoading(true);

    try {
      const result = await cancelSale(saleId);

      if (result.success) {
        addToast("Venta anulada con éxito", "success");
      } else {
        addToast(result.error || "Ocurrió un error desconocido.", "error");
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("Error de cliente al anular venta:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al intentar anular.";
      addToast(message, "error");
      throw err;
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
        className={`
          text-sm font-semibold border px-3 py-1 rounded transition
          ${
            loading
              ? "bg-gray-200 text-gray-500 cursor-wait"
              : "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800"
          }
        `}
      >
        Anular
      </button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCancel}
        title="Anular Venta"
        description="¿Estás seguro de anular esta venta? Si ya fue liquidada, se generará una deuda al dueño."
        confirmText="Sí, anular venta"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}
