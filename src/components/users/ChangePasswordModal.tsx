"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { changePassword } from "@/actions/user-actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

interface ChangePasswordModalProps {
  user: { id: string; name: string };
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  user,
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordsMatch && password.length >= 6;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const result = await changePassword(user.id, password);
    if (result.success) {
      addToast(`Contraseña de ${user.name} actualizada.`, "success");
      handleClose();
    } else {
      addToast(result.error || "Error desconocido", "error");
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setShowConfirm(false);
    onClose();
  };

  const inputClass =
    "w-full bg-background border p-2.5 rounded-xl text-sm text-foreground focus:ring-2 outline-none transition font-medium";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={handleClose}
      ></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-3xl shadow-2xl border border-border w-[90vw] max-w-md z-50 animate-in zoom-in-95">
        <h2 className="text-lg font-black text-foreground mb-1 font-nunito">
          Cambiar Contraseña
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Estás editando la contraseña de{" "}
          <strong className="text-foreground">{user.name}</strong>.
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-muted-foreground uppercase pl-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inputClass + " border-input focus:ring-primary"}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-muted-foreground uppercase pl-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir para confirmar"
              className={cn(
                inputClass,
                confirmPassword && !passwordsMatch
                  ? "border-destructive focus:ring-destructive"
                  : "border-input focus:ring-primary",
              )}
            />
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive font-bold pl-1">
              Las contraseñas no coinciden.
            </p>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl font-bold text-sm bg-foreground text-background hover:bg-foreground/90 transition shadow-lg disabled:opacity-50"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="¿Confirmar Cambio?"
        description={`Se establecerá una nueva contraseña para ${user.name}. Esta acción no se puede deshacer.`}
        confirmText="Sí, Cambiar"
        variant="default"
      />
    </>
  );
}
