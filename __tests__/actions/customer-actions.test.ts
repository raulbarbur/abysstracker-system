import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  markSaleAsPaid,
} from "@/actions/customer-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    customer: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    sale: {
      count: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: prismaMock };
});

describe("Customer Actions (Server Action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);
  });

  describe("createCustomer", () => {
    it("Debe fallar si el nombre está vacío", async () => {
      const formData = new FormData();
      const result = await createCustomer(formData);
      expect(result.error).toBe("El nombre es obligatorio");
    });

    it("Debe crear un cliente con éxito", async () => {
      const formData = new FormData();
      formData.append("name", "Cliente");

      vi.mocked(prisma.customer.create).mockResolvedValue({
        id: "new-id",
        name: "Cliente",
      } as any);

      const result = await createCustomer(formData);

      expect(result.success).toBe(true);
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Cliente", isActive: true }),
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/customers");
    });
  });

  describe("deleteCustomer (Invariantes de Integridad)", () => {
    it("Debe bloquear la eliminación si el cliente tiene deuda activa (PENDING)", async () => {
      const formData = new FormData();
      formData.append("id", "cust-debtor");

      vi.mocked(prisma.sale.count).mockResolvedValue(1);

      const result = await deleteCustomer(formData);

      expect(result.error).toContain("El cliente tiene deuda activa");
      expect(prisma.customer.delete).not.toHaveBeenCalled();
      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it("Debe realizar baja LÓGICA (isActive: false) si el cliente tiene historial de ventas", async () => {
      const formData = new FormData();
      formData.append("id", "cust-history");

      vi.mocked(prisma.sale.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: "cust-history",
        _count: { sales: 5 },
      } as any);

      const result = await deleteCustomer(formData);

      expect(result.success).toBe(true);
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: "cust-history" },
        data: { isActive: false },
      });
      expect(prisma.customer.delete).not.toHaveBeenCalled();
    });

    it("Debe realizar borrado FÍSICO si el cliente no tiene deudas ni historial", async () => {
      const formData = new FormData();
      formData.append("id", "cust-clean");

      vi.mocked(prisma.sale.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: "cust-clean",
        _count: { sales: 0 },
      } as any);

      const result = await deleteCustomer(formData);

      expect(result.success).toBe(true);
      expect(prisma.customer.delete).toHaveBeenCalledWith({
        where: { id: "cust-clean" },
      });
    });

    it("Debe restaurar un cliente (isActive: true) si el flag restore está presente", async () => {
      const formData = new FormData();
      formData.append("id", "cust-restore");
      formData.append("restore", "true");

      await deleteCustomer(formData);

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: "cust-restore" },
        data: { isActive: true },
      });
    });
  });

  describe("markSaleAsPaid", () => {
    it("Debe fallar si no hay sesión iniciada", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const result = await markSaleAsPaid("sale-1");
      expect(result.error).toBe("No autorizado");
    });

    it("Debe actualizar el pago y devolver datos formateados", async () => {
      const mockSale = {
        id: "sale-1",
        createdAt: new Date(),
        total: 1500,
        paymentMethod: "CASH",
        items: [{ description: "Prod A", quantity: 1, priceAtSale: 1500 }],
      };

      vi.mocked(prisma.sale.update).mockResolvedValue(mockSale as any);

      const result = await markSaleAsPaid("sale-1");

      expect(result.success).toBe(true);
      expect(result.saleData?.total).toBe(1500);
      expect(prisma.sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sale-1" },
          data: expect.objectContaining({ paymentStatus: "PAID" }),
        }),
      );
    });
  });
});
