"use client";

import { createCustomer, updateCustomer } from "@/actions/customer-actions";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type CustomerData = {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export default function CustomerForm({
  initialData,
}: {
  initialData?: CustomerData;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const handleConfirmSubmit = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    try {
      if (initialData?.id) {
        formData.append("id", initialData.id);
        const result = await updateCustomer(formData);

        if (result && "success" in result) {
          addToast("Cliente actualizado", "success");
          router.refresh();
        } else if (result && "error" in result) {
          throw new Error(result.error);
        }
      } else {
        const result = await createCustomer(formData);

        if (result && "success" in result) {
          addToast("Cliente creado", "success");
          formRef.current.reset();
          router.refresh();
        } else if (result && "error" in result) {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      addToast(error.message || "Error al procesar la solicitud", "error");
    } finally {
      setShowConfirm(false);
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
          {initialData ? (
            <>
              <Icon name="edit" className="w-5 h-5" /> Editar Cliente
            </>
          ) : (
            <>
              <Icon name="user" className="w-5 h-5" /> Nuevo Cliente
            </>
          )}
        </h2>

        <form ref={formRef} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Nombre y Apellido *</label>
            <input
              name="name"
              defaultValue={initialData?.name}
              type="text"
              required
              autoFocus
              className={inputClass}
              placeholder="Ej: Laura Gómez"
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

          <CollapsibleSection title="Más Datos de Contacto" iconName="info">
            <div className="space-y-4 pt-2">
              <div>
                <label className={labelClass}>Email (Opcional)</label>
                <input
                  name="email"
                  defaultValue={initialData?.email || ""}
                  type="email"
                  className={inputClass}
                  placeholder="cliente@mail.com"
                />
              </div>

              <div>
                <label className={labelClass}>Dirección (Opcional)</label>
                <input
                  name="address"
                  defaultValue={initialData?.address || ""}
                  type="text"
                  className={inputClass}
                  placeholder="Av. Principal 123"
                />
              </div>
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
        title={initialData ? "¿Guardar Cambios?" : "¿Crear Nuevo Cliente?"}
        description={
          initialData
            ? "Se actualizará la información del cliente en la base de datos."
            : "Se dará de alta un nuevo cliente. Verificá que el nombre sea correcto."
        }
        confirmText="Confirmar Guardado"
        variant="default"
      />
    </>
  );
}
