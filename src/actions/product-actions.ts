"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UnitOfMeasure } from "@prisma/client";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

type VariantInput = {
  id?: string;
  name: string;
  costPrice: number;
  salePrice: number;
};

async function resolveCategoryId(formData: FormData): Promise<string | null> {
  const isNewCategory = formData.get("isNewCategory") === "true";
  if (isNewCategory) {
    const newName = formData.get("categoryName") as string;
    if (!newName || newName.trim() === "") return null;

    const existing = await prisma.category.findFirst({
      where: { name: { equals: newName, mode: "insensitive" } },
    });
    if (existing) return existing.id;

    const created = await prisma.category.create({
      data: { name: newName.trim() },
    });
    return created.id;
  }
  return formData.get("categoryId") as string;
}

function validateVariants(variants: VariantInput[]): string | null {
  if (!Array.isArray(variants) || variants.length === 0) {
    return "Debe haber al menos una variante.";
  }
  for (const v of variants) {
    const cost = Number(v.costPrice);
    const price = Number(v.salePrice);
    if (isNaN(cost) || isNaN(price))
      return `Error en "${v.name}": Precios inválidos.`;
    if (cost < 0 || price < 0)
      return `Error en "${v.name}": Importes negativos.`;
    if (price < cost) return `Rentabilidad negativa en "${v.name}".`;
    if (!v.name || v.name.trim() === "")
      return "Todas las variantes deben tener nombre.";
  }
  return null;
}

export async function createProduct(formData: FormData) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "Sesión expirada." };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const ownerId = formData.get("ownerId") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const variantsJson = formData.get("variantsJson") as string;
  const unitOfMeasure =
    (formData.get("unitOfMeasure") as UnitOfMeasure) || UnitOfMeasure.UNIT;

  const categoryId = await resolveCategoryId(formData);
  if (!name || !ownerId || !categoryId)
    return { error: "Faltan datos obligatorios." };

  let variants: VariantInput[] = [];
  try {
    variants = JSON.parse(variantsJson || "[]");
  } catch (e) {
    return { error: "JSON inválido." };
  }

  const validationError = validateVariants(variants);
  if (validationError) return { error: validationError };

  try {
    await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          ownerId,
          categoryId,
          unitOfMeasure,
          isActive: true,
        },
      });

      for (const v of variants) {
        await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            name: v.name,
            imageUrl: imageUrl || null,
            costPrice: v.costPrice,
            salePrice: v.salePrice,
            stock: 0,
          },
        });
      }
    });
    revalidatePath("/products");
  } catch (error) {
    return { error: "Error interno al guardar producto." };
  }
  redirect("/products");
}

export async function updateProduct(formData: FormData) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado." };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const ownerId = formData.get("ownerId") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const variantsJson = formData.get("variantsJson") as string;
  const unitOfMeasure = formData.get("unitOfMeasure") as UnitOfMeasure;

  const categoryId = await resolveCategoryId(formData);
  if (!id || !name || !categoryId) return { error: "Datos faltantes" };

  let variants: VariantInput[] = [];
  try {
    variants = JSON.parse(variantsJson || "[]");
  } catch (e) {
    return { error: "Error en variantes." };
  }

  const validationError = validateVariants(variants);
  if (validationError) return { error: validationError };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          categoryId,
          ownerId,
          unitOfMeasure,
        },
      });

      for (const v of variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              costPrice: v.costPrice,
              salePrice: v.salePrice,
              imageUrl: imageUrl || undefined,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              costPrice: v.costPrice,
              salePrice: v.salePrice,
              stock: 0,
              imageUrl: imageUrl || null,
            },
          });
        }
      }
    });

    revalidatePath("/products");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { error: "No se pudo actualizar el producto." };
  }
}

export async function toggleProductStatus(
  productId: string,
  currentStatus: boolean,
) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado." };
  try {
    if (currentStatus === true) {
      const variantWithStock = await prisma.productVariant.findFirst({
        where: { productId, stock: { gt: 0 } },
      });
      if (variantWithStock)
        return { error: "No se puede archivar: Hay stock." };
    }
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/products");
    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    return { error: "Error cambiando estado" };
  }
}
