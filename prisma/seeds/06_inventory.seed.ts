import { PrismaClient, StockMovementType } from "@prisma/client";

export async function seedInventory(prisma: PrismaClient) {
  const allVariants = await prisma.productVariant.findMany({
    include: { product: true },
  });
  const inventoryOverseer = await prisma.user.findUnique({
    where: { id: "u-admin-arthur" },
  });

  if (!inventoryOverseer) return;

  let movementsCount = 0;
  let currentMovementDate = new Date("2025-01-01T08:00:00Z");

  for (const variant of allVariants) {
    let initialStock: number;
    if (variant.product.unitOfMeasure === "GRAM") {
      initialStock = 50000;
    } else {
      initialStock = 100;
    }

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: initialStock },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        quantity: initialStock,
        type: StockMovementType.ENTRY,
        reason: "Carga inicial de inventario - Despliegue AbyssTracker",
        userId: inventoryOverseer.id,
        createdAt: currentMovementDate,
      },
    });
    movementsCount++;
    currentMovementDate = new Date(currentMovementDate.getTime() + 60 * 1000);
  }

  console.log(
    `${allVariants.length} variantes inicializadas, ${movementsCount} movimientos registrados`,
  );
}
