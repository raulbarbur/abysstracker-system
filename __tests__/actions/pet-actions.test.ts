import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPet, deletePet } from "@/actions/pet-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    pet: { create: vi.fn(), delete: vi.fn() },
  };
  return { prisma: prismaMock };
});

describe("Pet Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ userId: "user-1" } as any);
  });

  describe("createPet", () => {
    it("Debe fallar si faltan datos obligatorios", async () => {
      const formData = new FormData();
      formData.append("name", "Firulais");
      const result = await createPet(formData);
      expect(result.error).toContain("Faltan datos obligatorios");
    });

    it('Debe asignar "Mestizo" si no se provee raza', async () => {
      const formData = new FormData();
      formData.append("name", "Pet name");
      formData.append("ownerName", "Owner name");
      formData.append("ownerPhone", "123456");

      await createPet(formData);

      expect(prisma.pet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ breed: "Mestizo" }),
      });
    });
  });

  describe("deletePet", () => {
    it("Debe lanzar error si la mascota tiene historial (P2003)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("FK fail", {
        code: "P2003",
        clientVersion: "5.x",
      });
      vi.mocked(prisma.pet.delete).mockRejectedValue(prismaError);
      await expect(deletePet("pet-with-history")).rejects.toThrow(
        "la mascota tiene historial asociado",
      );
    });

    it("Debe borrar exitosamente si no hay historial", async () => {
      vi.mocked(prisma.pet.delete).mockResolvedValue({ id: "pet-1" } as any);

      const result = await deletePet("pet-1");

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/pets");
    });
  });
});
