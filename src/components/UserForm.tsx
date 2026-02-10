"use client";

import { createUser } from "@/actions/user-actions";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function UserForm() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const handleConfirmSubmit = async () => {
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const result = await createUser(formData);

    if (result?.error) {
      addToast(result.error, "error");
    } else {
      addToast("Usuario creado correctamente", "success");
      formRef.current?.reset();
      setPass("");
      setConfirmPass("");
      router.refresh();
    }
  };

  const passwordsMatch = pass === confirmPass;

  return (
    <>
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
        <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2 font-nunito">
          <Icon name="user" className="w-5 h-5" /> Nuevo Usuario
        </h2>

        <form ref={formRef} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
              Nombre
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej: Juan Admin"
              className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
              Email (Login)
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="tucorreo@ejemplo.com"
              className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="******"
                  className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium pr-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
                Confirmar
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="******"
                  className={cn(
                    "w-full bg-background border p-2.5 rounded-xl text-sm text-foreground focus:ring-2 outline-none transition font-medium pr-8",
                    confirmPass && !passwordsMatch
                      ? "border-destructive focus:ring-destructive"
                      : "border-input focus:ring-primary",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon
                    name={showPassword ? "eyeOff" : "eye"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>
          </div>

          {confirmPass && !passwordsMatch && (
            <p className="text-xs text-destructive font-bold pl-1 -mt-2">
              Las contraseñas no coinciden
            </p>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
              Rol
            </label>
            <div className="relative">
              <select
                name="role"
                className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition font-bold appearance-none cursor-pointer"
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Icon name="chevronDown" className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (formRef.current?.checkValidity() && passwordsMatch) {
                setShowConfirm(true);
              } else {
                if (!passwordsMatch)
                  addToast("Las contraseñas no coinciden", "error");
                else formRef.current?.reportValidity();
              }
            }}
            className="w-full py-3 rounded-xl font-bold text-sm transition mt-4 shadow-lg bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            disabled={!pass || !confirmPass || !passwordsMatch}
          >
            Registrar Usuario
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="¿Crear Usuario?"
        description="Estás a punto de dar de alta un nuevo usuario con acceso al sistema."
        confirmText="Sí, Crear Usuario"
        variant="default"
      />
    </>
  );
}
