import { describe, it, expect, vi, beforeEach } from "vitest";
import { processSale, cancelSale } from "@/actions/sale-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CartItem } from "@/types/sale";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    productVariant: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      createMany: vi.fn(),
    },
    appointment: {
      updateMany: vi.fn(),
    },
    balanceAdjustment: {
      createMany: vi.fn(),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback) => await callback(prismaMock)),
  };
  return { prisma: prismaMock };
});

describe("Sale Actions (Integration & Invariants)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ userId: "cashier-1" } as any);
  });

  describe("processSale - Invariants & Logic", () => {
    it("INVARIANTE PRECIOS (FLEXIBLE): Debe permitir cambiar el precio para aplicar promociones", async () => {
      const cart: CartItem[] = [
        {
          id: "var-1",
          type: "PRODUCT",
          quantity: 1,
          price: 4500.0,
          description: "Producto en Promo",
        },
      ];

      vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
        {
          id: "var-1",
          salePrice: 5000.0,
          costPrice: 3000,
          product: { name: "Producto en Promo", unitOfMeasure: "UNIT" },
        },
      ] as any);

      vi.mocked(prisma.productVariant.updateMany).mockResolvedValue({
        count: 1,
      });
      vi.mocked(prisma.sale.create).mockResolvedValue({
        id: "s1",
        createdAt: new Date(),
      } as any);

      const result = await processSale(cart, 4500, "CASH");

      expect(result.total).toBe(4500);
      expect(prisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ total: 4500 }),
        }),
      );
    });

    it("INVARIANTE REDONDEO: Debe redondear correctamente subtotales complejos con precios manuales", async () => {
      const cart: CartItem[] = [
        {
          id: "var-1",
          type: "PRODUCT",
          quantity: 3,
          price: 10.33,
          description: "Prod",
        },
      ];

      vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
        {
          id: "var-1",
          salePrice: 15.0,
          costPrice: 5,
          product: { name: "Prod", unitOfMeasure: "UNIT" },
        },
      ] as any);
      vi.mocked(prisma.productVariant.updateMany).mockResolvedValue({
        count: 1,
      });
      vi.mocked(prisma.sale.create).mockResolvedValue({
        id: "s1",
        createdAt: new Date(),
      } as any);

      const result = await processSale(cart, 31, "CASH");

      expect(result.total).toBe(30.99);
    });

    it("INVARIANTE CTA. CTE: Debe fallar si falta customerId en CHECKING_ACCOUNT", async () => {
      const cart: CartItem[] = [
        {
          id: "p1",
          type: "PRODUCT",
          quantity: 1,
          price: 100,
          description: "Prod",
        },
      ];
      const result = await processSale(
        cart,
        100,
        "CHECKING_ACCOUNT",
        undefined,
      );
      expect(result.error).toBe(
        "Para fiar (Cuenta Corriente) debés seleccionar un cliente.",
      );
    });

    it("ATOMICIDAD: Debe fallar la venta completa si un producto no tiene stock", async () => {
      const cart: CartItem[] = [
        {
          id: "ok",
          type: "PRODUCT",
          quantity: 1,
          price: 10,
          description: "OK",
        },
        {
          id: "no-stock",
          type: "PRODUCT",
          quantity: 100,
          price: 10,
          description: "Sin Stock",
        },
      ];

      vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
        { id: "ok", product: { name: "OK", unitOfMeasure: "UNIT" } },
        {
          id: "no-stock",
          product: { name: "Sin Stock", unitOfMeasure: "UNIT" },
        },
      ] as any);

      vi.mocked(prisma.productVariant.updateMany)
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const result = await processSale(cart, 110, "CASH");

      expect(result.error).toContain("Stock insuficiente");
      expect(prisma.sale.create).not.toHaveBeenCalled();
    });
  });

  describe("cancelSale - Consistency", () => {
    it("DEBE revertir stock y generar ajuste de balance si la venta estaba liquidada", async () => {
      const mockSale = {
        id: "sale-1",
        status: "COMPLETED",
        items: [
          {
            variantId: "var-1",
            quantity: 2,
            costAtSale: 100,
            settledQuantity: 2,
            variant: {
              product: { ownerId: "owner-123" },
            },
          },
        ],
      };
      vi.mocked(prisma.sale.findUnique).mockResolvedValue(mockSale as any);

      const result = await cancelSale("sale-1");

      expect(result.success).toBe(true);
      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "var-1" },
          data: { stock: { increment: 2 } },
        }),
      );
      expect(prisma.balanceAdjustment.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            ownerId: "owner-123",
            amount: -200,
          }),
        ]),
      });
    });

    it("No debe permitir cancelar una venta ya cancelada", async () => {
      vi.mocked(prisma.sale.findUnique).mockResolvedValue({
        id: "s1",
        status: "CANCELLED",
      } as any);
      const result = await cancelSale("s1");
      expect(result.error).toBe("Ya está anulada");
    });
  });
});
