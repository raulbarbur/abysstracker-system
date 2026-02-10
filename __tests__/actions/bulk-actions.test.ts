import { describe, it, expect, vi, beforeEach } from "vitest";
import { importProductBatch } from "@/actions/bulk-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StockMovementType } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    owner: { findMany: vi.fn() },
    category: { findMany: vi.fn(), create: vi.fn() },
    product: { findMany: vi.fn(), create: vi.fn() },
    productVariant: { create: vi.fn(), update: vi.fn() },
    stockMovement: { create: vi.fn() },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback) => await callback(prismaMock)),
  };
  return { prisma: prismaMock };
});

describe("Bulk Actions - importProductBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Seguridad y Validación Inicial", () => {
    it("Debe fallar si el usuario no es ADMIN", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "USER" } as any);
      const result = await importProductBatch([
        {
          name: "Test",
          categoryName: "C1",
          ownerName: "O1",
          cost: 10,
          price: 20,
        },
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Requiere permisos de Administrador");
    });

    it("Debe fallar si el lote supera los 200 productos", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
      const largeBatch = new Array(201).fill({
        name: "P",
        categoryName: "C",
        ownerName: "O",
        cost: 1,
        price: 2,
      });

      const result = await importProductBatch(largeBatch);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Límite de seguridad");
    });
  });

  describe("Lógica de Negocio e Invariantes", () => {
    beforeEach(() => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "admin-1",
        role: "ADMIN",
      } as any);
    });

    it("Debe fallar si el Dueño (Owner) no existe en el sistema", async () => {
      vi.mocked(prisma.owner.findMany).mockResolvedValue([]);

      const rows = [
        {
          name: "Prod",
          categoryName: "Cat",
          ownerName: "Inexistente",
          cost: 100,
          price: 200,
        },
      ];
      const result = await importProductBatch(rows);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dueño desconocido: "Inexistente"');
    });

    it("Debe crear un producto nuevo si no existe", async () => {
      vi.mocked(prisma.owner.findMany).mockResolvedValue([
        { id: "own-1", name: "Usuario" },
      ] as any);
      vi.mocked(prisma.category.findMany).mockResolvedValue([
        { id: "cat-1", name: "Alimentos" },
      ] as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      vi.mocked(prisma.product.create).mockResolvedValue({
        id: "new-p",
        variants: [{ id: "new-v" }],
      } as any);

      const rows = [
        {
          name: "Nuevo Item",
          categoryName: "Alimentos",
          ownerName: "Usuario",
          cost: 50,
          price: 100,
        },
      ];
      const result = await importProductBatch(rows);

      expect(result.success).toBe(true);
      expect(result.stats?.created).toBe(1);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Nuevo Item" }),
        }),
      );
    });

    it("Debe actualizar precios de variante existente y generar movimiento de stock", async () => {
      vi.mocked(prisma.owner.findMany).mockResolvedValue([
        { id: "own-1", name: "Usuario" },
      ] as any);
      vi.mocked(prisma.category.findMany).mockResolvedValue([
        { id: "cat-1", name: "Alimentos" },
      ] as any);

      const existingProduct = {
        id: "p-1",
        name: "Existente",
        ownerId: "own-1",
        unitOfMeasure: "UNIT",
        variants: [{ id: "v-1", name: "Estándar", stock: 10 }],
      };
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        existingProduct,
      ] as any);

      const rows = [
        {
          name: "Existente",
          categoryName: "Alimentos",
          ownerName: "Usuario",
          cost: 60,
          price: 120,
          stock: 5,
        },
      ];

      const result = await importProductBatch(rows);

      expect(result.success).toBe(true);
      expect(result.stats?.updated).toBe(1);
      expect(result.stats?.stockMoves).toBe(1);

      // Verifica actualización de precios
      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "v-1" },
          data: { costPrice: 60, salePrice: 120 },
        }),
      );

      // Verifica incremento de stock y movimiento
      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "v-1" },
          data: { stock: { increment: 5 } },
        }),
      );
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 5, type: "ENTRY" }),
        }),
      );
    });

    it("Debe bloquear el cambio de Unidad de Medida si el producto ya existe", async () => {
      vi.mocked(prisma.owner.findMany).mockResolvedValue([
        { id: "own-1", name: "Usuario" },
      ] as any);
      vi.mocked(prisma.category.findMany).mockResolvedValue([
        { id: "cat-1", name: "Alimentos" },
      ] as any);

      const existingProduct = {
        id: "p-1",
        name: "Shampoo",
        ownerId: "own-1",
        unitOfMeasure: "UNIT",
        variants: [{ id: "v-1", name: "Estándar" }],
      };
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        existingProduct,
      ] as any);

      // Intentamos subirlo como 'GRAMOS'
      const rows = [
        {
          name: "Shampoo",
          categoryName: "Alimentos",
          ownerName: "Usuario",
          cost: 10,
          price: 20,
          unit: "Gramos",
        },
      ];

      const result = await importProductBatch(rows);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Conflicto de unidad");
      expect(prisma.productVariant.update).not.toHaveBeenCalled();
    });
  });
});
