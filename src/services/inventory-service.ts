import { prisma } from "@/lib/prisma";

export type StockHistoryEntry = {
  id: string;
  date: Date;
  type: string;
  quantity: number;
  reason: string | null;
  user: string;
  balanceAfter: number | null;
};

export async function getVariantStockHistory(
  variantId: string,
  limit = 50,
): Promise<StockHistoryEntry[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return movements.map((m) => ({
    id: m.id,
    date: m.createdAt,
    type: m.type,
    quantity: m.quantity,
    reason: m.reason || "Sin detalle",
    user: m.userId,
    balanceAfter: null,
  }));
}

export function translateMovementType(type: string): string {
  const dictionary: Record<string, string> = {
    ENTRY: "Ingreso Mercadería",
    SALE: "Venta",
    ADJUSTMENT: "Ajuste Manual",
    OWNER_WITHDRAWAL: "Retiro de Dueño",
    RETURN: "Devolución",
    SALE_CANCELLED: "Venta Anulada",
  };
  return dictionary[type] || type;
}
