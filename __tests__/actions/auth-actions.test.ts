import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  login,
  logout,
  requestPasswordReset,
  resetPassword,
} from "@/actions/auth-actions";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  deleteSession,
  hashPassword,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { Role } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("crypto", () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => "fixed-reset-token"),
  })),
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => "fixed-reset-token"),
    })),
  },
}));

const mockResendSuccess = {
  data: { id: "email-id" },
  error: null,
  headers: null,
};

const mockResendInstance = {
  emails: {
    send: vi.fn().mockResolvedValue(mockResendSuccess),
  },
};

vi.mock("resend", () => {
  class MockResend {
    constructor() {
      return mockResendInstance;
    }
  }
  return { Resend: MockResend };
});

describe("Auth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirect).mockImplementation(() => {
      return undefined as never;
    });
    mockResendInstance.emails.send.mockClear();
  });

  describe("login", () => {
    it("Debe iniciar sesión y redirigir con credenciales válidas", async () => {
      const formData = new FormData();
      formData.append("email", "test@user.com");
      formData.append("password", "password123");

      const mockUser = {
        id: "user-1",
        email: "test@user.com",
        password: "hashedpassword",
        role: "ADMIN" as Role,
        name: "Test User",
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      await login(formData);

      expect(createSession).toHaveBeenCalledWith(
        "user-1",
        "ADMIN",
        "Test User",
      );
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("Debe devolver error si el usuario no existe", async () => {
      const formData = new FormData();
      formData.append("email", "nouser@user.com");
      formData.append("password", "password123");

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const result = await login(formData);

      expect(result).toEqual({ error: "Credenciales inválidas." });
    });
  });

  describe("logout", () => {
    it("Debe borrar la sesión y redirigir a /login", async () => {
      await logout();
      expect(deleteSession).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("requestPasswordReset", () => {
    it("Debe enviar un correo de recuperación si el usuario existe", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      const formData = new FormData();
      formData.append("email", "exists@user.com");

      const mockUser = { id: "user-reset" } as any;
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await requestPasswordReset(formData);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resetToken: "fixed-reset-token" }),
        }),
      );

      expect(mockResendInstance.emails.send).toHaveBeenCalled();
      expect(result?.message).toContain("Correo enviado");
    });

    it("Debe devolver un mensaje de éxito genérico si el usuario NO existe", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      const formData = new FormData();
      formData.append("email", "nouser@user.com");

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await requestPasswordReset(formData);

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mockResendInstance.emails.send).not.toHaveBeenCalled();
      expect(result?.message).toContain("Si el correo existe");
    });

    it("Debe devolver error si RESEND_API_KEY no está configurada", async () => {
      delete process.env.RESEND_API_KEY;
      const formData = new FormData();
      formData.append("email", "a@a.com");

      const result = await requestPasswordReset(formData);

      expect(result?.error).toContain("servicio de correo no está configurado");
    });
  });

  describe("resetPassword", () => {
    it("Debe actualizar la contraseña con un token válido", async () => {
      const formData = new FormData();
      formData.append("token", "valid-token");
      formData.append("password", "newStrongPassword");

      const mockUser = { id: "user-token" } as any;
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);
      vi.mocked(hashPassword).mockResolvedValue("newHashedPassword");

      const result = await resetPassword(formData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-token" },
        data: {
          password: "newHashedPassword",
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
