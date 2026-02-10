import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser, deleteUser } from "@/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { prisma: prismaMock };
});

describe("User Actions (Security & RBAC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    it("Debe rechazar si el usuario no es ADMIN", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "staff-1",
        role: "STAFF",
      } as any);

      const formData = new FormData();
      const result = await createUser(formData);

      expect(result.error).toContain("Permisos insuficientes");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("Debe rechazar si el email ya existe", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "admin-1",
        role: "ADMIN",
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "existing-id",
      } as any);

      const formData = new FormData();
      formData.append("email", "test@test.com");
      formData.append("name", "Test");
      formData.append("password", "123");

      const result = await createUser(formData);

      expect(result.error).toBe("El email ya está registrado.");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("Debe hashear la contraseña antes de crear el usuario", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "admin-1",
        role: "ADMIN",
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue("hashed-secret-123");

      const formData = new FormData();
      formData.append("email", "new@test.com");
      formData.append("name", "New User");
      formData.append("password", "secret123");

      await createUser(formData);

      expect(hashPassword).toHaveBeenCalledWith("secret123");
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          password: "hashed-secret-123",
        }),
      });
    });
  });

  describe("deleteUser (Integridad y Anti-Lockout)", () => {
    it("Debe impedir que un administrador se elimine a sí mismo", async () => {
      const myId = "admin-1";
      vi.mocked(getSession).mockResolvedValue({
        userId: myId,
        role: "ADMIN",
      } as any);

      const result = await deleteUser(myId);

      expect(result.error).toContain("No puedes eliminar tu propio usuario");
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it("Debe manejar el error de historial asociado (FK Constraint)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "admin-1",
        role: "ADMIN",
      } as any);

      const prismaError = new Prisma.PrismaClientKnownRequestError("FK fail", {
        code: "P2003",
        clientVersion: "5.x",
      });
      vi.mocked(prisma.user.delete).mockRejectedValue(prismaError);

      const result = await deleteUser("user-with-sales");

      expect(result.error).toContain(
        "el usuario tiene historial crítico asociado",
      );
      expect(result.success).toBeUndefined();
    });

    it("Debe eliminar exitosamente si es un admin borrando a otro sin historial", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "admin-1",
        role: "ADMIN",
      } as any);
      vi.mocked(prisma.user.delete).mockResolvedValue({
        id: "target-id",
      } as any);

      const result = await deleteUser("target-id");

      expect(result.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: "target-id" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
    });
  });
});
