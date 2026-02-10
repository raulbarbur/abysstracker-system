import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMonthlyFinancialReport,
  getInventoryValuation,
  getSalesByCategoryReport,
} from "@/actions/financial-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UnitOfMeasure } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    sale: { findMany: vi.fn() },
    productVariant: { findMany: vi.fn() },
    saleItem: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
  };
  return { prisma: prismaMock };
});

describe("Financial Actions (Reports & Analytics)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Seguridad y Acceso", () => {
    it("Debe rechazar el acceso si el usuario no es ADMIN", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "STAFF" } as any);

      const result = await getMonthlyFinancialReport(2024, 5);

      expect(result.error).toContain("Se requieren permisos de Administrador");
      expect(prisma.sale.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getMonthlyFinancialReport - Lógica de Pesables", () => {
    it("Debe calcular COGS y Unidades correctamente para productos por GRAMO", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);

      const mockSales = [
        {
          total: 5000,
          items: [
            {
              quantity: 1500,
              costAtSale: 1000,
              variantId: "v1",
              variant: {
                product: { unitOfMeasure: UnitOfMeasure.GRAM },
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.sale.findMany).mockResolvedValue(mockSales as any);

      const result = await getMonthlyFinancialReport(2024, 2);

      expect(result.data?.metrics.cogs).toBe(1500);

      expect(result.data?.metrics.netIncome).toBe(3500);

      expect(result.data?.metrics.totalUnitsSold).toBe(1);
    });
  });

  describe("getInventoryValuation", () => {
    it("Debe valuar correctamente el stock físico mezclando unidades y peso", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);

      const mockVariants = [
        {
          stock: 10,
          costPrice: 100,
          salePrice: 200,
          product: { id: "p1", unitOfMeasure: UnitOfMeasure.UNIT },
        },
        {
          stock: 2000,
          costPrice: 500,
          salePrice: 1000,
          product: { id: "p2", unitOfMeasure: UnitOfMeasure.GRAM },
        },
      ];

      vi.mocked(prisma.productVariant.findMany).mockResolvedValue(
        mockVariants as any,
      );

      const result = await getInventoryValuation();

      expect(result.data?.cost).toBe(2000);

      expect(result.data?.retail).toBe(4000);

      expect(result.data?.totalStock).toBe(11);
    });
  });

  describe("getSalesByCategoryReport", () => {
    it("Debe agrupar ventas por categoría y aplicar factores de peso", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);

      const mockItems = [
        {
          quantity: 500,
          priceAtSale: 2000,
          costAtSale: 1000,
          variant: {
            product: {
              unitOfMeasure: UnitOfMeasure.GRAM,
              category: { id: "cat-1", name: "Alimento" },
            },
          },
        },
      ];

      vi.mocked(prisma.saleItem.findMany).mockResolvedValue(mockItems as any);

      const result = await getSalesByCategoryReport(2024, 2);

      expect(result.data?.[0].total).toBe(1000);
      expect(result.data?.[0].name).toBe("Alimento");
    });
  });
});
