"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowContent(true);
      document.body.style.overflow = "hidden";
      setError(null);
    } else {
      const timer = setTimeout(() => setShowContent(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  if (!isOpen && !showContent) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      <div
        className={cn(
          "relative bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 transform transition-all duration-300",
          isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
        )}
      >
        <div className="mb-4">
          <h3 className="text-xl font-black text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-xl mb-4 font-bold border border-destructive/20 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary transition disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
              variant === "destructive"
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                : "bg-primary hover:bg-primary/90 shadow-primary/20",
            )}
          >
            {loading && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
