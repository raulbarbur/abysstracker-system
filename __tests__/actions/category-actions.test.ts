import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCategory } from "@/actions/category-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      create: vi.fn(),
    },
  },
}));

describe("Category Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCategory", () => {
    it("Debe fallar si no hay sesión activa (No autorizado)", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "Limpieza");

      const result = await createCategory(formData);

      expect(result).toEqual({ success: false, error: "No autorizado" });
      expect(prisma.category.create).not.toHaveBeenCalled();
    });

    it("Debe devolver error si el nombre está ausente o vacío (Validation)", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);

      const formData = new FormData();
      formData.append("name", "   ");

      const result = await createCategory(formData);

      expect(result).toEqual({
        success: false,
        error: "El nombre de la categoría es obligatorio",
      });
      expect(prisma.category.create).not.toHaveBeenCalled();
    });

    it("Debe crear la categoría exitosamente y aplicar trim al nombre", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);
      vi.mocked(prisma.category.create).mockResolvedValue({
        id: "cat-1",
        name: "Alimentos",
      } as any);

      const formData = new FormData();
      formData.append("name", "  Alimentos  ");

      const result = await createCategory(formData);

      expect(result).toEqual({ success: true });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: "Alimentos" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/categories");
    });

    it("Debe manejar el error de duplicidad (Prisma P2002)", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);

      const prismaError = new Error("Unique constraint failed");
      (prismaError as any).code = "P2002";
      vi.mocked(prisma.category.create).mockRejectedValue(prismaError);

      const formData = new FormData();
      formData.append("name", "Existente");

      const result = await createCategory(formData);

      expect(result).toEqual({
        success: false,
        error: "Esta categoría ya existe",
      });
    });

    it("Debe manejar errores genéricos de base de datos", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);
      vi.mocked(prisma.category.create).mockRejectedValue(
        new Error("Fatal DB Error"),
      );

      const formData = new FormData();
      formData.append("name", "Error Test");

      const result = await createCategory(formData);

      expect(result).toEqual({
        success: false,
        error: "Error interno al crear la categoría",
      });
    });
  });
});
