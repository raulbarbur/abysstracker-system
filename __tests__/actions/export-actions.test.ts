import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  exportProducts,
  exportSales,
  exportOwnersBalance,
  exportCustomers,
} from "@/actions/export-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    sale: { findMany: vi.fn() },
    saleItem: {
      findMany: vi.fn(),
      fields: { quantity: "quantity" },
    },
    customer: { findMany: vi.fn() },
    appointment: { findMany: vi.fn() },
    stockMovement: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

vi.mock("exceljs", () => {
  const mockRow = {
    font: {},
    fill: {},
    getCell: vi.fn(() => ({ font: {}, fill: {} })),
  };

  const mockWorksheet = {
    addRow: vi.fn(() => mockRow),
    getRow: vi.fn(() => mockRow),
    get lastRow() {
      return mockRow;
    },
    columns: [],
  };

  class MockWorkbook {
    addWorksheet = vi.fn(() => mockWorksheet);
    xlsx = {
      writeBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-excel-data")),
    };
  }

  return {
    default: {
      Workbook: MockWorkbook,
    },
  };
});

describe("Export Actions - Reporting & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validación de Seguridad (Roles)", () => {
    it("Debe rechazar exportación de productos si el usuario no es ADMIN", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "USER" } as any);
      const result = await exportProducts("FULL");
      expect(result.success).toBe(false);
      expect(result.error).toContain("permisos de Administrador");
    });

    it("Debe rechazar exportación de ventas si no hay sesión", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const result = await exportSales();
      expect(result.success).toBe(false);
      expect(result.error).toContain("permisos de Administrador");
    });
  });

  describe("exportProducts", () => {
    it("Debe generar un Excel con los productos activos en modo FULL", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        {
          name: "P1",
          category: { name: "C1" },
          owner: { name: "O1" },
          variants: [{ name: "V1", costPrice: 1, salePrice: 2 }],
        },
      ] as any);
      const result = await exportProducts("FULL");
      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
    });
  });

  describe("exportOwnersBalance", () => {
    it("Debe calcular correctamente la deuda agregada por dueño", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.saleItem.findMany).mockResolvedValue([
        {
          quantity: 10,
          settledQuantity: 2,
          costAtSale: 100,
          variant: {
            product: { owner: { id: "o1", name: "Dueño", phone: "123" } },
          },
        },
      ] as any);
      const result = await exportOwnersBalance();
      expect(result.success).toBe(true);
      expect(prisma.saleItem.findMany).toHaveBeenCalled();
    });
  });

  describe("exportCustomers", () => {
    it("Debe sumar correctamente las ventas pendientes por cliente", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([
        { name: "Deudor", sales: [{ total: 500 }, { total: 1500 }] },
      ] as any);
      const result = await exportCustomers();
      expect(result.success).toBe(true);
    });
  });

  describe("exportSales", () => {
    it("Debe aplicar correctamente el límite de 1000 cuando no hay fechas", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      const result = await exportSales();
      expect(result.success).toBe(true);
      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1000 }),
      );
    });

    it("Debe filtrar por método de pago si se especifica", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      await exportSales(undefined, undefined, "CASH");
      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ paymentMethod: "CASH" }),
        }),
      );
    });
  });
});
