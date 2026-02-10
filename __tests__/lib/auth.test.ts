import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("Auth Library", () => {
  describe("Password Hashing", () => {
    it("hashPassword debe generar un hash válido (no texto plano)", async () => {
      const password = "my-secret-password";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it("verifyPassword debe retornar true con la clave correcta", async () => {
      const password = "password123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("verifyPassword debe retornar false con la clave incorrecta", async () => {
      const hash = await hashPassword("password123");
      const isValid = await verifyPassword("wrong-password", hash);
      expect(isValid).toBe(false);
    });
  });
});
