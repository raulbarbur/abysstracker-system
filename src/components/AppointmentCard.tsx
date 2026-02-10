"use client";

import {
  cancelAppointment,
  updateAppointmentStatus,
} from "@/actions/appointment-actions";
import Link from "next/link";
import { useState } from "react";
import { cn, getAppointmentStatusStyles } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const getSpanishStatus = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "En progreso";
    case "COMPLETED":
      return "Completado";
    case "BILLED":
      return "Cobrado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
};

type AppointmentData = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  pet: { name: string; breed: string | null; ownerName: string };
};

export default function AppointmentCard({
  appt,
  readonly,
}: {
  appt: AppointmentData;
  readonly?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const start = appt.startTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = appt.endTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { container, badge } = getAppointmentStatusStyles(appt.status);
  const label = getSpanishStatus(appt.status);

  const handleStatusChange = async (newStatus: "CONFIRMED" | "COMPLETED") => {
    setLoading(true);
    await updateAppointmentStatus(appt.id, newStatus);
    setLoading(false);
  };

  const handleConfirmCancel = async () => {
    const fd = new FormData();
    fd.append("id", appt.id);
    await cancelAppointment(fd);
  };

  return (
    <>
      <div
        className={cn(
          "p-4 rounded-xl shadow-sm border border-transparent border-l-4 transition-all duration-200 hover:scale-[1.01]",
          container,
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center min-w-[60px] bg-background/50 rounded-lg p-2 backdrop-blur-sm">
              <span className="text-xl font-black text-foreground">
                {start}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                {end}
              </span>
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground leading-none mb-1">
                {appt.pet.name}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                {appt.pet.breed} • {appt.pet.ownerName}
              </p>
              <span
                className={cn(
                  "inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                  badge,
                )}
              >
                {label}
              </span>
            </div>
          </div>
          {!readonly && (
            <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
              {appt.status === "PENDING" && (
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange("CONFIRMED")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
                >
                  <Icon name="pets" className="h-3 w-3" />
                  LLEGÓ
                </button>
              )}
              {appt.status === "CONFIRMED" && (
                <button
                  disabled={loading}
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm animate-pulse flex items-center gap-1.5"
                >
                  <Icon name="sparkles" className="h-3 w-3" />
                  LISTO
                </button>
              )}
              {appt.status !== "BILLED" && appt.status !== "CANCELLED" && (
                <Link
                  href={`/pos?apptId=${appt.id}&petName=${encodeURIComponent(appt.pet.name)}`}
                  className="bg-foreground text-background hover:bg-foreground/90 text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Icon name="finance" className="h-3 w-3" />
                  COBRAR
                </Link>
              )}
              {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                <button
                  onClick={() => setIsCancelling(true)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isCancelling}
        onClose={() => setIsCancelling(false)}
        onConfirm={handleConfirmCancel}
        title="¿Cancelar Turno?"
        description={`El turno de ${appt.pet.name} se marcará como 'Cancelado' pero permanecerá en el historial.`}
        confirmText="Sí, cancelar"
        variant="destructive"
      />
    </>
  );
}
