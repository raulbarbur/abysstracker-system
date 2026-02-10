import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAppointment,
  cancelAppointment,
  updateAppointmentStatus,
} from "@/actions/appointment-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/utils", () => ({
  buildArgentinaDate: vi.fn((date, time) => new Date(`${date}T${time}:00Z`)),
}));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    appointment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback) => await callback(prismaMock)),
  };
  return { prisma: prismaMock };
});

describe("Appointment Actions (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);
  });

  describe("createAppointment", () => {
    it("Debe rechazar duraciones fuera de rango (1-480)", async () => {
      const formData = new FormData();
      formData.append("petId", "pet-1");
      formData.append("date", "2026-10-10");
      formData.append("time", "10:00");
      formData.append("duration", "500");

      const result = await createAppointment(formData);
      expect(result.error).toContain("duración debe ser entre 1 y 480");
    });

    it("Debe detectar una colisión de horario ANTES de crear", async () => {
      const formData = new FormData();
      formData.append("petId", "pet-new");
      formData.append("date", "2026-10-10");
      formData.append("time", "10:00");
      formData.append("duration", "60");

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
        id: "appt-existing",
        pet: { name: "Bobby" },
      } as any);

      const result = await createAppointment(formData);
      expect(result.error).toContain("Horario ocupado por Bobby");
      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

    it("Debe manejar una Race Condition (Detección después del insert)", async () => {
      const formData = new FormData();
      formData.append("petId", "pet-new");
      formData.append("date", "2026-10-10");
      formData.append("time", "10:00");

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(null);

      vi.mocked(prisma.appointment.create).mockResolvedValue({
        id: "my-new-id",
      } as any);

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({
        id: "other-ninja-id",
      } as any);

      const result = await createAppointment(formData);
      expect(result.error).toContain("El horario fue ocupado por otro usuario");
    });

    it("Debe crear el turno exitosamente si no hay conflictos", async () => {
      const formData = new FormData();
      formData.append("petId", "pet-1");
      formData.append("date", "2026-05-20");
      formData.append("time", "15:00");
      formData.append("duration", "30");

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.create).mockResolvedValue({
        id: "appt-1",
      } as any);

      const result = await createAppointment(formData);
      expect(result.success).toBe(true);
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            petId: "pet-1",
            status: "PENDING",
          }),
        }),
      );
    });
  });

  describe("cancelAppointment & updateStatus", () => {
    it("Debe impedir la cancelación de un turno ya facturado (BILLED)", async () => {
      const formData = new FormData();
      formData.append("id", "appt-billed");

      vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
        status: "BILLED",
      } as any);

      const result = await cancelAppointment(formData);
      expect(result.error).toBe(
        "No se puede cancelar un turno que ya fue cobrado.",
      );
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it("Debe impedir cambios de estado si el turno ya está cobrado", async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
        status: "BILLED",
      } as any);

      const result = await updateAppointmentStatus("appt-billed", "COMPLETED");
      expect(result.error).toBe("Turno cobrado. No admite cambios.");
    });

    it("Debe permitir cancelar un turno PENDING", async () => {
      const formData = new FormData();
      formData.append("id", "appt-pending");

      vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
        status: "PENDING",
      } as any);

      const result = await cancelAppointment(formData);
      expect(result.success).toBe(true);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "appt-pending" },
        data: { status: "CANCELLED" },
      });
    });
  });
});
