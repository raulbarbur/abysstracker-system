"use client";

import {
  login,
  requestPasswordReset,
  resetPassword,
} from "@/actions/auth-actions";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { useSearchParams, useRouter } from "next/navigation";

type ViewState = "LOGIN" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [view, setView] = useState<ViewState>("LOGIN");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      setView("RESET_PASSWORD");
    }
  }, [searchParams]);

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    setMessage(null);
    const res = await login(formData);
    if (res?.error) {
      setMessage({ text: res.error, type: "error" });
      setLoading(false);
    }
  };

  const handleForgot = async (formData: FormData) => {
    setLoading(true);
    setMessage(null);
    const res = await requestPasswordReset(formData);

    setLoading(false);
    if (res?.error) {
      setMessage({ text: res.error, type: "error" });
    } else if (res?.success) {
      setMessage({ text: res.message || "Correo enviado", type: "success" });
    }
  };

  const handleReset = async (formData: FormData) => {
    setLoading(true);
    setMessage(null);

    if (!resetToken) return;
    formData.append("token", resetToken);

    const res = await resetPassword(formData);

    setLoading(false);
    if (res?.error) {
      setMessage({ text: res.error, type: "error" });
    } else {
      setMessage({
        text: "Contraseña actualizada. Inicia sesión.",
        type: "success",
      });
      setTimeout(() => {
        setView("LOGIN");
        router.replace("/login");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black text-foreground font-nunito tracking-tighter">
            ABYSSTRACKER
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {view === "LOGIN" && "Sistema de Gestión"}
            {view === "FORGOT_PASSWORD" && "Recuperar Acceso"}
            {view === "RESET_PASSWORD" && "Nueva Contraseña"}
          </p>
        </div>

        {message && (
          <div
            className={cn(
              "text-sm p-3 rounded-xl mb-6 font-bold text-center border animate-in shake",
              message.type === "error"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            )}
          >
            {message.text}
          </div>
        )}

        {view === "LOGIN" && (
          <form
            action={handleLogin}
            className={cn(
              "space-y-5 relative z-10",
              loading && "opacity-70 pointer-events-none",
            )}
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                placeholder="tucorreo@ejemplo.com"
                className="w-full border border-input p-3.5 rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••"
                  className="w-full border border-input p-3.5 rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon
                    name={showPassword ? "eyeOff" : "eye"}
                    className="w-5 h-5"
                  />
                </button>
              </div>

              {/* --- ELIMINAR BLOQUE PARA IMPLEMENTAR RECUPERACION DE CONTRASEÑA --- */}
              {/*
                    <div className="text-right">
                        <button type="button" onClick={() => { setMessage(null); setView('FORGOT_PASSWORD') }} className="text-xs font-bold text-primary hover:underline">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                    */}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-black text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
        )}

        {view === "FORGOT_PASSWORD" && (
          <form
            action={handleForgot}
            className={cn(
              "space-y-5 relative z-10",
              loading && "opacity-70 pointer-events-none",
            )}
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
                Email de Recuperación
              </label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                placeholder="tucorreo@ejemplo.com"
                className="w-full border border-input p-3.5 rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-black text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            >
              {loading ? "Enviando..." : "Enviar Enlace"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setView("LOGIN");
              }}
              className="w-full py-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              Volver al Login
            </button>
          </form>
        )}

        {view === "RESET_PASSWORD" && (
          <form
            action={handleReset}
            className={cn(
              "space-y-5 relative z-10",
              loading && "opacity-70 pointer-events-none",
            )}
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-muted-foreground uppercase pl-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Nueva contraseña segura"
                  className="w-full border border-input p-3.5 rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon
                    name={showPassword ? "eyeOff" : "eye"}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-black text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            >
              {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-[10px] text-muted-foreground font-medium">
            v3.0 • Secure Access
          </p>
        </div>
      </div>
    </div>
  );
}
