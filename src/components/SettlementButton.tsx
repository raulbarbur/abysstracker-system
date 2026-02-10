"use client";

import { useState, useRef, MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function SettlementButton() {
  const { pending } = useFormStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    formRef.current = e.currentTarget.form;
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        type="submit"
        onClick={handleClick}
        disabled={pending || isModalOpen}
        className={cn(
          "flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition active:scale-95 text-white w-full md:w-auto",
          pending
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 hover:shadow-green-900/20",
        )}
      >
        {pending ? (
          <>
            <Icon name="loader" className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Icon name="check" className="w-5 h-5" />
            Confirmar Pago
          </>
        )}
      </button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title="¿Confirmar Entrega de Dinero?"
        description="Esta acción marcará los items seleccionados como PAGADOS. Este proceso no se puede deshacer fácilmente."
        confirmText="SÍ, CONFIRMAR PAGO"
        cancelText="Cancelar"
        variant="default"
      />
    </>
  );
}
