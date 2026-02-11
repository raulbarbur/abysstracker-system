"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { buildArgentinaDate } from "@/lib/utils";
import { getSession } from "@/lib/auth";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

type ApptStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "BILLED"
  | "CANCELLED";

export async function createAppointment(formData: FormData) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado" };

  const petId = formData.get("petId") as string;
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;
  const duration = parseInt(formData.get("duration") as string) || 60;

  if (!petId || !dateStr || !timeStr)
    return { error: "Faltan datos (Mascota, Fecha u Hora)" };
  if (duration <= 0 || duration > 480)
    return { error: "La duración debe ser entre 1 y 480 minutos." };

  try {
    const startTime = buildArgentinaDate(dateStr, timeStr);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    if (isNaN(startTime.getTime())) return { error: "Fecha u hora inválida" };

    await prisma.$transaction(async (tx) => {
      const collision = await tx.appointment.findFirst({
        where: {
          status: { not: "CANCELLED" },
          AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
        },
        include: { pet: true },
      });

      if (collision) {
        throw new Error(`Horario ocupado por ${collision.pet.name}`);
      }

      const newAppt = await tx.appointment.create({
        data: { petId, startTime, endTime, status: "PENDING" },
      });

      const raceCondition = await tx.appointment.findFirst({
        where: {
          id: { not: newAppt.id },
          status: { not: "CANCELLED" },
          AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
        },
      });
      if (raceCondition)
        throw new Error(
          "El horario fue ocupado por otro usuario. Intenta de nuevo.",
        );
    });

    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error interno al crear el turno" };
  }
}

export async function cancelAppointment(formData: FormData) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado" };
  const id = formData.get("id") as string;
  if (!id) return { error: "ID no provisto" };

  try {
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!appt) return { error: "Turno no encontrado" };
    if (appt.status === "BILLED")
      return { error: "No se puede cancelar un turno que ya fue cobrado." };

    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/agenda");
    return { success: true };
  } catch {
    return { error: "Error interno al cancelar" };
  }
}

export async function updateAppointmentStatus(
  id: string,
  newStatus: ApptStatus,
) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado" };

  try {
    const current = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (current?.status === "BILLED")
      return { error: "Turno cobrado. No admite cambios." };

    await prisma.appointment.update({
      where: { id },
      data: { status: newStatus },
    });
    revalidatePath("/agenda");
    return { success: true };
  } catch {
    return { error: "No se pudo actualizar el estado" };
  }
}

export async function getAppointmentsHistory() {
  const session = await getSession();
  if (!session) return { success: false, error: "No autorizado" };
  try {
    const data = await prisma.appointment.findMany({
      orderBy: { startTime: "desc" },
      take: 2000,
      include: {
        pet: { select: { name: true, ownerName: true, breed: true } },
      },
    });
    return { success: true, data };
  } catch {
    return { success: false, error: "Error al obtener el historial" };
  }
}
