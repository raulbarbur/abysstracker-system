"use client";

import { createPet } from "@/actions/pet-actions";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useRouter } from "next/navigation";

export function PetForm() {
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const handleConfirmSubmit = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    try {
      await createPet(formData);
      addToast("Mascota registrada exitosamente", "success");
      formRef.current.reset();
      router.refresh();
    } catch (error) {
      throw new Error("Error al crear la mascota");
    }
  };

  const inputClass =
    "w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none transition";
  const labelClass =
    "block text-xs font-bold text-muted-foreground uppercase mb-1.5";

  return (
    <>
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border sticky top-6">
        <h2 className="text-xl font-black text-foreground mb-6 font-nunito flex items-center gap-2">
          <Icon name="pets" className="w-6 h-6 text-primary" />
          Nueva Ficha
        </h2>

        <form ref={formRef} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre Mascota *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej: Bobby"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Raza</label>
            <input
              name="breed"
              type="text"
              placeholder="Ej: Caniche"
              className={inputClass}
            />
          </div>
          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs text-primary font-bold mb-4 uppercase">
              Datos del Dueño
            </p>
            <div className="mb-4">
              <label className={labelClass}>Nombre Humano *</label>
              <input
                name="ownerName"
                type="text"
                required
                placeholder="Ej: Maria Perez"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono / WhatsApp *</label>
              <input
                name="ownerPhone"
                type="text"
                required
                placeholder="Ej: 11 1234 5678"
                className={inputClass}
              />
            </div>
          </div>
          <div className="pt-2">
            <label className={labelClass}>Notas Generales</label>
            <textarea
              name="notes"
              rows={2}
              className={inputClass}
              placeholder="Ej: Alérgico al pollo"
            ></textarea>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (formRef.current?.checkValidity()) {
                  setShowConfirm(true);
                } else {
                  formRef.current?.reportValidity();
                }
              }}
              className="w-full py-3 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 transition shadow-lg"
            >
              Guardar Ficha
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="¿Registrar Mascota?"
        description="Se creará una nueva ficha de mascota y se asociará al dueño indicado."
        confirmText="Crear Ficha"
        variant="default"
      />
    </>
  );
}
