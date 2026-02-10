import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPaginatedCustomers } from "@/services/customer-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("Customer Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPaginatedCustomers", () => {
    it("Debe aplicar paginación básica correctamente", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(25);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const result = await getPaginatedCustomers({ page: 2, pageSize: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        }),
      );
      expect(result.totalPages).toBe(3);
    });

    it("Debe filtrar por clientes activos por defecto", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await getPaginatedCustomers({ page: 1, pageSize: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ isActive: true }]),
          }),
        }),
      );
    });

    it("Debe filtrar por clientes archivados si se solicita", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await getPaginatedCustomers({
        page: 1,
        pageSize: 10,
        filter: "archived",
      });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ isActive: false }]),
          }),
        }),
      );
    });

    it("Debe construir la búsqueda (query) en múltiples campos", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await getPaginatedCustomers({ page: 1, pageSize: 10, query: "Juan" });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: [
                  { name: { contains: "Juan", mode: "insensitive" } },
                  { phone: { contains: "Juan", mode: "insensitive" } },
                  { email: { contains: "Juan", mode: "insensitive" } },
                ],
              }),
            ]),
          }),
        }),
      );
    });

    it("Debe calcular la deuda sumando solo ventas COMPLETED y PENDING", async () => {
      const mockCustomers = [
        {
          id: "cust-1",
          name: "Juan Pérez",
          sales: [{ total: 1500.5 }, { total: 500.0 }],
        },
      ];

      vi.mocked(prisma.customer.count).mockResolvedValue(1);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(
        mockCustomers as any,
      );
      const result = await getPaginatedCustomers({ page: 1, pageSize: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            sales: {
              where: { status: "COMPLETED", paymentStatus: "PENDING" },
              select: { total: true },
            },
          }),
        }),
      );
      expect(result.customers[0].currentDebt).toBe(2000.5);
    });

    it("Debe aplicar el filtro de deuda (solo clientes con deudas)", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await getPaginatedCustomers({ page: 1, pageSize: 10, filter: "debt" });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                sales: {
                  some: { status: "COMPLETED", paymentStatus: "PENDING" },
                },
              }),
            ]),
          }),
        }),
      );
    });
  });
});
