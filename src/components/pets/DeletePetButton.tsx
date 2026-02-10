"use client";

import { useState } from "react";
import { deletePet } from "@/actions/pet-actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Icon } from "@/components/ui/Icon";

interface Props {
  id: string;
  petName: string;
}

export function DeletePetButton({ id, petName }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deletePet(id);
    } catch (error: any) {
      throw new Error(error.message || "Error inesperado al eliminar.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-muted-foreground hover:text-destructive text-[10px] font-bold px-2 py-1 transition flex items-center gap-1"
        title="Eliminar Ficha"
      >
        <Icon name="trash" className="h-3 w-3" />
        ELIMINAR
      </button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title={`¿Eliminar a ${petName}?`}
        description="Esta acción es irreversible. Si la mascota tiene historial de turnos o deudas, el sistema impedirá el borrado."
        confirmText="Sí, eliminar ficha"
        variant="destructive"
      />
    </>
  );
}
