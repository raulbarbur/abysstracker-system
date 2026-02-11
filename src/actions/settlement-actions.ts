"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { UnitOfMeasure } from "@prisma/client";

// --- MEJORA: DEMO GUARD ---
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

type SettlementItemInput = {
  id: string;
  type: "SALE" | "ADJUSTMENT";
  quantity?: number;
};

const round = (num: number) => Math.round(num * 100) / 100;

export async function createSettlement(formData: FormData) {
  if (isDemoMode) return demoError; // Interceptación Demo

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Requiere permisos de Administrador para liquidar." };
  }

  const ownerId = formData.get("ownerId") as string;
  const selectionJson = formData.get("selection") as string;

  if (!ownerId || !selectionJson) {
    return { error: "Datos incompletos para la liquidación." };
  }

  let selection: SettlementItemInput[] = [];
  try {
    selection = JSON.parse(selectionJson);
  } catch (e) {
    return { error: "Formato de selección inválido." };
  }

  if (selection.length === 0) {
    return { error: "No seleccionaste ningún ítem para pagar." };
  }

  const saleItemIds = selection
    .filter((i) => i.type === "SALE")
    .map((i) => i.id);

  const adjustmentIds = selection
    .filter((i) => i.type === "ADJUSTMENT")
    .map((i) => i.id);

  try {
    const dbSaleItems = await prisma.saleItem.findMany({
      where: { id: { in: saleItemIds } },
      include: {
        variant: { include: { product: true } },
        sale: true,
      },
    });

    const dbAdjustments = await prisma.balanceAdjustment.findMany({
      where: { id: { in: adjustmentIds } },
    });

    const saleItemsMap = new Map(dbSaleItems.map((item) => [item.id, item]));
    const adjustmentsMap = new Map(dbAdjustments.map((adj) => [adj.id, adj]));

    let calculatedTotal = 0;
    const settlementLinesData: any[] = [];
    const saleItemUpdates: { id: string; increment: number }[] = [];
    const adjustmentIdsToUpdate: string[] = [];

    for (const item of selection) {
      if (item.type === "SALE") {
        const dbItem = saleItemsMap.get(item.id);

        if (!dbItem) throw new Error(`Item de venta no encontrado: ${item.id}`);
        if (!item.quantity || item.quantity <= 0)
          throw new Error(`Cantidad inválida para item ${item.id}`);

        if (dbItem.variant?.product.ownerId !== ownerId) {
          throw new Error(
            `El item ${dbItem.description} no pertenece a este dueño.`,
          );
        }

        if (dbItem.sale.paymentStatus !== "PAID") {
          throw new Error(
            `No se puede liquidar "${dbItem.description}" porque el cliente AÚN NO PAGÓ.`,
          );
        }

        const pendingQty = dbItem.quantity - dbItem.settledQuantity;
        if (item.quantity > pendingQty) {
          throw new Error(
            `Error en ${dbItem.description}: Intentás pagar ${item.quantity} pero solo se deben ${pendingQty}.`,
          );
        }

        let quantityFactor = item.quantity;
        if (dbItem.variant?.product.unitOfMeasure === UnitOfMeasure.GRAM) {
          quantityFactor = item.quantity / 1000;
        }

        const lineAmount = round(Number(dbItem.costAtSale) * quantityFactor);
        calculatedTotal = round(calculatedTotal + lineAmount);

        settlementLinesData.push({
          saleItemId: dbItem.id,
          quantity: item.quantity,
          amount: lineAmount,
        });

        saleItemUpdates.push({
          id: dbItem.id,
          increment: item.quantity,
        });
      } else if (item.type === "ADJUSTMENT") {
        const dbAdj = adjustmentsMap.get(item.id);

        if (!dbAdj) throw new Error(`Ajuste no encontrado: ${item.id}`);
        if (dbAdj.ownerId !== ownerId) throw new Error("Ajuste ajeno.");
        if (dbAdj.isApplied) throw new Error("Este ajuste ya fue pagado.");

        const adjAmount = Number(dbAdj.amount);
        calculatedTotal = round(calculatedTotal + adjAmount);

        adjustmentIdsToUpdate.push(dbAdj.id);
      }
    }

    if (calculatedTotal <= 0) {
      throw new Error(
        `El total a pagar es $${calculatedTotal}. No se pueden registrar liquidaciones negativas o en cero.`,
      );
    }

    await prisma.$transaction(
      async (tx) => {
        const newSettlement = await tx.settlement.create({
          data: {
            ownerId,
            totalAmount: calculatedTotal,
          },
        });

        if (settlementLinesData.length > 0) {
          await tx.settlementLine.createMany({
            data: settlementLinesData.map((line) => ({
              ...line,
              settlementId: newSettlement.id,
            })),
          });
        }

        await Promise.all(
          saleItemUpdates.map((update) =>
            tx.saleItem.update({
              where: { id: update.id },
              data: { settledQuantity: { increment: update.increment } },
            }),
          ),
        );

        if (adjustmentIdsToUpdate.length > 0) {
          await tx.balanceAdjustment.updateMany({
            where: { id: { in: adjustmentIdsToUpdate } },
            data: {
              isApplied: true,
              settlementId: newSettlement.id,
            },
          });
        }
      },
      {
        timeout: 20000,
      },
    );

    revalidatePath("/owners/balance");
    revalidatePath(`/owners/settlement/${ownerId}`);
    revalidatePath(`/owners/${ownerId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error en liquidación:", error);
    return { error: error.message || "Error interno al procesar el pago." };
  }
}
