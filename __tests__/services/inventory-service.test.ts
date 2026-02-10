import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVariantStockHistory,
  translateMovementType,
} from "@/services/inventory-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stockMovement: {
      findMany: vi.fn(),
    },
  },
}));

describe("Inventory Service (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("translateMovementType", () => {
    it("Debe traducir tipos de movimiento conocidos al español", () => {
      expect(translateMovementType("ENTRY")).toBe("Ingreso Mercadería");
      expect(translateMovementType("SALE")).toBe("Venta");
      expect(translateMovementType("SALE_CANCELLED")).toBe("Venta Anulada");
    });

    it("Debe devolver el código original si el tipo es desconocido", () => {
      expect(translateMovementType("UNKNOWN_CODE")).toBe("UNKNOWN_CODE");
    });
  });

  describe("getVariantStockHistory", () => {
    it("Debe obtener el historial y formatearlo correctamente", async () => {
      const mockDate = new Date("2024-01-01T12:00:00Z");
      const mockDbResponse = [
        {
          id: "mov-1",
          createdAt: mockDate,
          type: "ENTRY",
          quantity: 50,
          reason: "Stock inicial",
          userId: "admin-1",
          variantId: "var-1",
        },
      ];

      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue(
        mockDbResponse as any,
      );
      const result = await getVariantStockHistory("var-1");

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: { variantId: "var-1" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      expect(result[0]).toEqual({
        id: "mov-1",
        date: mockDate,
        type: "ENTRY",
        quantity: 50,
        reason: "Stock inicial",
        user: "admin-1",
        balanceAfter: null,
      });
    });
  });
});
