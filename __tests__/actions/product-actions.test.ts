import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProduct,
  updateProduct,
  toggleProductStatus,
} from "@/actions/product-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    category: { findFirst: vi.fn(), create: vi.fn() },
    product: { create: vi.fn(), update: vi.fn() },
    productVariant: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback) => await callback(prismaMock)),
  };
  return { prisma: prismaMock };
});

describe("Product Actions (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ userId: "admin-1" } as any);
  });

  const getBaseFormData = () => {
    const fd = new FormData();
    fd.append("name", "Producto de Prueba");
    fd.append("ownerId", "owner-123");
    fd.append("categoryId", "cat-123");
    return fd;
  };

  describe("createProduct - Validaciones e Invariantes", () => {
    it("Debe fallar si no hay variantes", async () => {
      const formData = getBaseFormData();
      formData.append("variantsJson", "[]");

      const result = await createProduct(formData);
      expect(result.error).toBe("Debe haber al menos una variante.");
    });

    it("Debe fallar si la rentabilidad es negativa (salePrice < costPrice)", async () => {
      const formData = getBaseFormData();
      const variants = [{ name: "Estándar", costPrice: 100, salePrice: 80 }];
      formData.append("variantsJson", JSON.stringify(variants));

      const result = await createProduct(formData);
      expect(result.error).toContain("Rentabilidad negativa");
    });

    it("Debe fallar si los importes son negativos", async () => {
      const formData = getBaseFormData();
      const variants = [{ name: "Estándar", costPrice: -10, salePrice: 50 }];
      formData.append("variantsJson", JSON.stringify(variants));

      const result = await createProduct(formData);
      expect(result.error).toContain("Importes negativos");
    });
  });

  describe("createProduct - Lógica de Categoría", () => {
    it("Debe reutilizar una categoría existente si el nombre coincide (case-insensitive)", async () => {
      const formData = new FormData();
      formData.append("name", "Producto A");
      formData.append("ownerId", "owner-1");
      formData.append("isNewCategory", "true");
      formData.append("categoryName", "ALIMENTOS");
      formData.append(
        "variantsJson",
        JSON.stringify([{ name: "v1", costPrice: 10, salePrice: 20 }]),
      );

      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: "cat-existente",
        name: "alimentos",
      } as any);

      await createProduct(formData);

      expect(prisma.category.create).not.toHaveBeenCalled();
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoryId: "cat-existente" }),
        }),
      );
    });
  });

  describe("toggleProductStatus - Invariante de Seguridad", () => {
    it("Debe impedir archivar un producto si alguna variante tiene stock", async () => {
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
        id: "v1",
        stock: 10,
      } as any);

      const result = await toggleProductStatus("prod-1", true);

      expect(result.error).toBe("No se puede archivar: Hay stock.");
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it("Debe permitir archivar si el stock es cero", async () => {
      vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null);

      const result = await toggleProductStatus("prod-1", true);

      expect(result.success).toBe(true);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { isActive: false },
      });
    });
  });
});
