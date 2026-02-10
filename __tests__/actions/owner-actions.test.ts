import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOwner, updateOwner } from "@/actions/owner-actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    owner: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Owner Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOwner", () => {
    it("Debe crear un dueño exitosamente cuando los datos son válidos", async () => {
      const formData = new FormData();
      formData.append("name", "Juan Perez");
      formData.append("email", "juan@example.com");
      formData.append("phone", "12345678");

      vi.mocked(prisma.owner.create).mockResolvedValue({
        id: "owner-1",
      } as any);
      const result = await createOwner(formData);

      expect(result.success).toBe(true);
      expect(prisma.owner.create).toHaveBeenCalledWith({
        data: {
          name: "Juan Perez",
          email: "juan@example.com",
          phone: "12345678",
          isActive: true,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/owners");
    });

    it("Debe devolver error si el nombre está ausente", async () => {
      const formData = new FormData();
      const result = await createOwner(formData);
      expect(result.error).toBe("El nombre es obligatorio");
      expect(prisma.owner.create).not.toHaveBeenCalled();
    });

    it("Debe manejar errores de la base de datos", async () => {
      const formData = new FormData();
      formData.append("name", "Error Test");
      vi.mocked(prisma.owner.create).mockRejectedValue(new Error("DB Error"));
      const result = await createOwner(formData);
      expect(result.error).toBe("Error creando dueño");
    });
  });

  describe("updateOwner", () => {
    it("Debe actualizar un dueño correctamente", async () => {
      const formData = new FormData();
      formData.append("id", "owner-123");
      formData.append("name", "Nombre Actualizado");
      formData.append("email", "nuevo@email.com");

      vi.mocked(prisma.owner.update).mockResolvedValue({
        id: "owner-123",
      } as any);
      const result = await updateOwner(formData);

      expect(result.success).toBe(true);
      expect(prisma.owner.update).toHaveBeenCalledWith({
        where: { id: "owner-123" },
        data: {
          name: "Nombre Actualizado",
          email: "nuevo@email.com",
          phone: null,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/owners");
    });

    it("Debe fallar si falta el ID o el Nombre", async () => {
      const formData = new FormData();
      formData.append("id", "owner-123");
      const result = await updateOwner(formData);
      expect(result.error).toBe("Faltan datos");
      expect(prisma.owner.update).not.toHaveBeenCalled();
    });
  });
});
