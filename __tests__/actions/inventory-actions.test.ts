import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerStockMovement } from "@/actions/inventory-actions";
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
    productVariant: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("Inventory Actions (Server Action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: "admin-user",
      role: "ADMIN",
    } as any);
  });

  describe("registerStockMovement", () => {
    it("Debe rechazar la operación si no hay sesión", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const formData = new FormData();
      const result = await registerStockMovement(formData);

      expect(result).toEqual({ error: "Sesión no válida" });
    });

    it("Debe rechazar cantidades negativas o cero", async () => {
      const formData = new FormData();
      formData.append("variantId", "var-1");
      formData.append("type", "ENTRY");
      formData.append("quantity", "-5");

      const result = await registerStockMovement(formData);
      expect(result.error).toContain("Datos incorrectos");
    });

    it("Debe incrementar stock correctamente para productos por unidad", async () => {
      const formData = new FormData();
      formData.append("variantId", "var-1");
      formData.append("type", "ENTRY");
      formData.append("quantity", "10");
      formData.append("reason", "Compra");

      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
        id: "var-1",
        product: { unitOfMeasure: "UNIT" },
      } as any);

      const result = await registerStockMovement(formData);

      expect(result).toEqual({ success: true });

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: "var-1" },
        data: { stock: { increment: 10 } },
      });

      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 10,
            type: "ENTRY",
            userId: "admin-user",
          }),
        }),
      );
    });

    it("Debe convertir KG a Gramos antes de guardar", async () => {
      const formData = new FormData();
      formData.append("variantId", "var-weight");
      formData.append("type", "ENTRY");
      formData.append("quantity", "1.5");

      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
        id: "var-weight",
        product: { unitOfMeasure: "GRAM" },
      } as any);

      await registerStockMovement(formData);

      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: { increment: 1500 } },
        }),
      );
    });

    it("Debe fallar si se intenta retirar más stock del disponible", async () => {
      const formData = new FormData();
      formData.append("variantId", "var-1");
      formData.append("type", "ADJUSTMENT"); // Resta stock
      formData.append("quantity", "50");

      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
        id: "var-1",
        product: { unitOfMeasure: "UNIT" },
      } as any);

      vi.mocked(prisma.productVariant.updateMany).mockResolvedValue({
        count: 0,
      });

      const result = await registerStockMovement(formData);
      expect(result.error).toBe(
        "Stock insuficiente para realizar esta operación.",
      );

      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
        where: {
          id: "var-1",
          stock: { gte: 50 },
        },
        data: { stock: { decrement: 50 } },
      });
    });
  });
});
