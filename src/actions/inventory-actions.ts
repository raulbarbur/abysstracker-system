"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  getVariantStockHistory,
  translateMovementType,
} from "@/services/inventory-service";
import { StockMovementType, UnitOfMeasure } from "@prisma/client";
import { getSession } from "@/lib/auth";

export async function registerStockMovement(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sesión no válida" };
  const variantId = formData.get("variantId") as string;
  const reason = formData.get("reason") as string;
  const typeStr = formData.get("type") as string;
  const rawQuantityInput = parseFloat(formData.get("quantity") as string);

  const allowedTypes = ["ENTRY", "OWNER_WITHDRAWAL", "ADJUSTMENT"];
  if (!allowedTypes.includes(typeStr)) {
    return { error: "Tipo de movimiento inválido" };
  }
  const type = typeStr as StockMovementType;

  if (!variantId || isNaN(rawQuantityInput) || rawQuantityInput <= 0) {
    return { error: "Datos incorrectos. La cantidad debe ser mayor a 0." };
  }

  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) return { error: "Producto no encontrado." };

    const isWeighted = variant.product.unitOfMeasure === UnitOfMeasure.GRAM;
    const quantityInBaseUnit = isWeighted
      ? Math.round(rawQuantityInput * 1000)
      : Math.round(rawQuantityInput);

    let finalQuantity = quantityInBaseUnit;
    if (type === "OWNER_WITHDRAWAL" || type === "ADJUSTMENT") {
      finalQuantity = -quantityInBaseUnit;
    }

    await prisma.$transaction(async (tx) => {
      if (finalQuantity < 0) {
        const quantityNeeded = Math.abs(finalQuantity);
        const updateResult = await tx.productVariant.updateMany({
          where: {
            id: variantId,
            stock: { gte: quantityNeeded },
          },
          data: {
            stock: { decrement: quantityNeeded },
          },
        });

        if (updateResult.count === 0) {
          throw new Error("Stock insuficiente para realizar esta operación.");
        }
      } else {
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: finalQuantity } },
        });
      }

      await tx.stockMovement.create({
        data: {
          variantId,
          quantity: finalQuantity,
          type: type,
          reason: reason || getDefaultReason(type),
          userId: session.userId,
        },
      });
    });

    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error gestionando stock:", error);
    return { error: error.message || "Error procesando el movimiento." };
  }
}

function getDefaultReason(type: string): string {
  switch (type) {
    case "ENTRY":
      return "Ingreso de mercadería";
    case "OWNER_WITHDRAWAL":
      return "Retiro de dueño";
    case "ADJUSTMENT":
      return "Baja por rotura/pérdida";
    default:
      return "Movimiento de stock";
  }
}

export async function getHistory(variantId: string) {
  if (!variantId) return { error: "ID requerido" };
  try {
    const rawHistory = await getVariantStockHistory(variantId);
    const history = rawHistory.map((h) => ({
      ...h,
      typeLabel: translateMovementType(h.type),
    }));
    return { success: true, data: history };
  } catch (error) {
    return { error: "Error al obtener datos" };
  }
}
