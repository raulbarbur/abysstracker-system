import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOwnerBalance, getAllOwners } from "@/services/owner-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    owner: {
      findMany: vi.fn(),
    },
    saleItem: {
      findMany: vi.fn(),
    },
    balanceAdjustment: {
      findMany: vi.fn(),
    },
  },
}));

describe("Owner Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllOwners", () => {
    it("Debe retornar la lista de dueños simplificada", async () => {
      const mockOwners = [
        { id: "1", name: "Dueño A" },
        { id: "2", name: "Dueño B" },
      ];
      vi.mocked(prisma.owner.findMany).mockResolvedValue(mockOwners as any);
      const result = await getAllOwners();
      expect(result).toEqual(mockOwners);
      expect(prisma.owner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, name: true },
        }),
      );
    });
  });

  describe("getOwnerBalance - Lógica Contable", () => {
    it("Debe calcular la deuda considerando solo items pagados y pendientes", async () => {
      const ownerId = "owner-123";
      const mockSaleItems = [
        { id: "item-1", quantity: 10, settledQuantity: 0, costAtSale: 100 },
        { id: "item-2", quantity: 10, settledQuantity: 4, costAtSale: 50 },
        { id: "item-3", quantity: 10, settledQuantity: 10, costAtSale: 200 },
      ];

      vi.mocked(prisma.saleItem.findMany).mockResolvedValue(
        mockSaleItems as any,
      );
      vi.mocked(prisma.balanceAdjustment.findMany).mockResolvedValue([]);
      const result = await getOwnerBalance(ownerId);
      expect(result.debtFromSales).toBe(1300);
      expect(result.pendingItemsCount).toBe(16);
      expect(prisma.saleItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sale: { status: "COMPLETED", paymentStatus: "PAID" },
          }),
        }),
      );
    });

    it("Debe integrar ajustes de balance pendientes al total neto", async () => {
      const ownerId = "owner-123";
      vi.mocked(prisma.saleItem.findMany).mockResolvedValue([
        { id: "i1", quantity: 5, settledQuantity: 0, costAtSale: 100 },
      ] as any);
      vi.mocked(prisma.balanceAdjustment.findMany).mockResolvedValue([
        { amount: 200 },
        { amount: -50 },
      ] as any);

      const result = await getOwnerBalance(ownerId);

      expect(result.debtFromSales).toBe(500);
      expect(result.debtFromAdjustments).toBe(150);
      expect(result.totalNetDebt).toBe(650);
    });

    it("Debe retornar ceros si no hay nada pendiente", async () => {
      vi.mocked(prisma.saleItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.balanceAdjustment.findMany).mockResolvedValue([]);
      const result = await getOwnerBalance("empty-owner");
      expect(result.totalNetDebt).toBe(0);
      expect(result.pendingItemsCount).toBe(0);
    });
  });
});
