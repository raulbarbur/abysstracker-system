"use client";

import { createOwner, updateOwner } from "@/actions/owner-actions";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type OwnerData = {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export default function OwnerForm({
  initialData,
}: {
  initialData?: OwnerData;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const handleConfirmSubmit = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    let result;

    if (initialData?.id) {
      formData.append("id", initialData.id);
      result = await updateOwner(formData);
      if (result.success) {
        addToast("Dueño actualizado", "success");
        router.push("/owners");
        router.refresh();
      }
    } else {
      result = await createOwner(formData);
      if (result?.success) {
        addToast("Dueño creado", "success");
        formRef.current.reset();
        router.refresh();
      }
    }

    if (result?.error) throw new Error(result.error);
  };

  const inputClass =
    "w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none transition";
  const labelClass =
    "block text-xs font-bold text-muted-foreground uppercase mb-1.5";

  return (
    <>
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border sticky top-6">
        <h2 className="text-xl font-black text-foreground mb-6 font-nunito flex items-center gap-2">
          {initialData ? (
            <>
              <Icon name="edit" className="w-5 h-5" /> Editar Dueño
            </>
          ) : (
            <>
              <Icon name="user" className="w-5 h-5" /> Nuevo Dueño
            </>
          )}
        </h2>

        <form ref={formRef} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Nombre Completo *</label>
            <input
              name="name"
              defaultValue={initialData?.name}
              type="text"
              required
              className={inputClass}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono / WhatsApp</label>
            <input
              name="phone"
              defaultValue={initialData?.phone || ""}
              type="text"
              className={inputClass}
              placeholder="11 1234 5678"
            />
          </div>

          <CollapsibleSection title="Información Extra" iconName="mail">
            <div className="pt-2">
              <label className={labelClass}>Email</label>
              <input
                name="email"
                defaultValue={initialData?.email || ""}
                type="email"
                className={inputClass}
                placeholder="juan@mail.com"
              />
            </div>
          </CollapsibleSection>

          <button
            type="button"
            onClick={() => {
              if (formRef.current?.checkValidity()) {
                setShowConfirm(true);
              } else {
                formRef.current?.reportValidity();
              }
            }}
            className="w-full py-3 rounded-xl font-bold text-primary-foreground shadow-lg transition active:scale-95 mt-2 bg-primary hover:bg-primary/90 shadow-primary/25"
          >
            Guardar Ficha
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title={initialData ? "¿Guardar Cambios?" : "¿Registrar Dueño?"}
        description={
          initialData
            ? "Se actualizarán los datos del proveedor/dueño."
            : "Se dará de alta un nuevo dueño en el sistema."
        }
        confirmText="Confirmar"
        variant="default"
      />
    </>
  );
}
