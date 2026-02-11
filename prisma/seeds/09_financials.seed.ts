import { PrismaClient } from "@prisma/client";

export async function seedFinancials(prisma: PrismaClient) {
  let totalSettlementsCreated = 0;
  let totalAdjustmentsCreated = 0;

  const saleItem_grn_1kg_001 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-001", variantId: "var-grn-1kg" },
  });
  if (saleItem_grn_1kg_001) {
    const settledQuantity_grn_001 = 1;
    const amount_grn_001 =
      Number(saleItem_grn_1kg_001.priceAtSale) * settledQuantity_grn_001;

    const settlement1_void = await prisma.settlement.create({
      data: {
        id: "settlement-ovn-001",
        ownerId: "own-void-nutrition",
        totalAmount: parseFloat(amount_grn_001.toFixed(2)),
        createdAt: new Date("2025-01-15T09:00:00Z"),
        items: {
          create: [
            {
              saleItemId: saleItem_grn_1kg_001.id,
              quantity: settledQuantity_grn_001,
              amount: parseFloat(amount_grn_001.toFixed(2)),
            },
          ],
        },
      },
    });
    totalSettlementsCreated++;

    await prisma.saleItem.update({
      where: { id: saleItem_grn_1kg_001.id },
      data: { settledQuantity: settledQuantity_grn_001 },
    });

    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-ovn-001-com",
        ownerId: "own-void-nutrition",
        amount: parseFloat((-amount_grn_001 * 0.05).toFixed(2)),
        description: "Comision estandar por transaccion Void.",
        isApplied: true,
        settlementId: settlement1_void.id,
        createdAt: new Date("2025-01-15T09:10:00Z"),
      },
    });
    totalAdjustmentsCreated++;
  }

  const saleItem_simulador_005 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-005", variantId: "var-simulador-lite" },
  });
  if (saleItem_simulador_005) {
    const amount_simulador_005 =
      Number(saleItem_simulador_005.priceAtSale) *
      saleItem_simulador_005.quantity;

    const settlement2_alpha = await prisma.settlement.create({
      data: {
        id: "settlement-alpha-001",
        ownerId: "own-alpha-core",
        totalAmount: parseFloat(amount_simulador_005.toFixed(2)),
        createdAt: new Date("2025-03-10T10:00:00Z"),
        items: {
          create: [
            {
              saleItemId: saleItem_simulador_005.id,
              quantity: saleItem_simulador_005.quantity,
              amount: parseFloat(amount_simulador_005.toFixed(2)),
            },
          ],
        },
      },
    });
    totalSettlementsCreated++;

    await prisma.saleItem.update({
      where: { id: saleItem_simulador_005.id },
      data: { settledQuantity: saleItem_simulador_005.quantity },
    });

    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-alpha-001-bonif",
        ownerId: "own-alpha-core",
        amount: parseFloat((amount_simulador_005 * 0.02).toFixed(2)),
        description: "Bonificacion por volumen de venta de simuladores.",
        isApplied: true,
        settlementId: settlement2_alpha.id,
        createdAt: new Date("2025-03-10T10:15:00Z"),
      },
    });
    totalAdjustmentsCreated++;
  }

  const saleItem_arnes_003 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-003", variantId: "var-arnes-m" },
  });
  if (saleItem_arnes_003) {
    const amount_arnes_003 =
      Number(saleItem_arnes_003.priceAtSale) * saleItem_arnes_003.quantity;

    const settlement_dark_001 = await prisma.settlement.create({
      data: {
        id: "settlement-dark-001",
        ownerId: "own-dark-horizon",
        totalAmount: parseFloat(amount_arnes_003.toFixed(2)),
        createdAt: new Date("2025-02-10T11:00:00Z"),
        items: {
          create: [
            {
              saleItemId: saleItem_arnes_003.id,
              quantity: saleItem_arnes_003.quantity,
              amount: parseFloat(amount_arnes_003.toFixed(2)),
            },
          ],
        },
      },
    });
    totalSettlementsCreated++;

    await prisma.saleItem.update({
      where: { id: saleItem_arnes_003.id },
      data: { settledQuantity: saleItem_arnes_003.quantity },
    });

    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-dark-001-com",
        ownerId: "own-dark-horizon",
        amount: parseFloat((-amount_arnes_003 * 0.07).toFixed(2)),
        description: "Comision por venta de equipamiento tactico.",
        isApplied: true,
        settlementId: settlement_dark_001.id,
        createdAt: new Date("2025-02-10T11:15:00Z"),
      },
    });
    totalAdjustmentsCreated++;
  }

  const saleItem_shampoo_001 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-001", variantId: "var-shamp-250ml" },
  });
  if (saleItem_shampoo_001) {
    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-nebula-001-pend",
        ownerId: "own-nebula-care",
        amount: parseFloat(
          (
            Number(saleItem_shampoo_001.priceAtSale) *
            saleItem_shampoo_001.quantity *
            0.01
          ).toFixed(2),
        ),
        description:
          "Bonificacion por volumen de ventas - Pendiente de aprobacion.",
        isApplied: false,
        settlementId: null,
        createdAt: new Date("2025-01-15T14:00:00Z"),
      },
    });
    totalAdjustmentsCreated++;
  }

  const saleItem_conc_002 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-002", variantId: "var-conc-500g" },
  });
  const saleItem_barras_006 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-006", variantId: "var-barras-10p" },
  });

  if (saleItem_conc_002 && saleItem_barras_006) {
    const amount_conc_002 =
      Number(saleItem_conc_002.priceAtSale) * saleItem_conc_002.quantity;
    const amount_barras_006 =
      Number(saleItem_barras_006.priceAtSale) * saleItem_barras_006.quantity;
    const total_settlement_multi = amount_conc_002 + amount_barras_006;

    const settlement_multi_void = await prisma.settlement.create({
      data: {
        id: "settlement-ovn-002",
        ownerId: "own-void-nutrition",
        totalAmount: parseFloat(total_settlement_multi.toFixed(2)),
        createdAt: new Date("2025-03-20T10:00:00Z"),
        items: {
          create: [
            {
              saleItemId: saleItem_conc_002.id,
              quantity: saleItem_conc_002.quantity,
              amount: parseFloat(amount_conc_002.toFixed(2)),
            },
            {
              saleItemId: saleItem_barras_006.id,
              quantity: saleItem_barras_006.quantity,
              amount: parseFloat(amount_barras_006.toFixed(2)),
            },
          ],
        },
      },
    });
    totalSettlementsCreated++;

    await prisma.saleItem.update({
      where: { id: saleItem_conc_002.id },
      data: { settledQuantity: saleItem_conc_002.quantity },
    });
    await prisma.saleItem.update({
      where: { id: saleItem_barras_006.id },
      data: { settledQuantity: saleItem_barras_006.quantity },
    });

    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-ovn-002-com",
        ownerId: "own-void-nutrition",
        amount: parseFloat((-total_settlement_multi * 0.06).toFixed(2)),
        description: "Comision consolidada por lote de transacciones.",
        isApplied: true,
        settlementId: settlement_multi_void.id,
        createdAt: new Date("2025-03-20T10:15:00Z"),
      },
    });
    totalAdjustmentsCreated++;

    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-ovn-003-pend",
        ownerId: "own-void-nutrition",
        amount: 25.0,
        description:
          "Ajuste manual por discrepancia en informe - Pendiente de resolucion.",
        isApplied: false,
        settlementId: settlement_multi_void.id,
        createdAt: new Date("2025-03-25T11:00:00Z"),
      },
    });
    totalAdjustmentsCreated++;
  }

  const saleItem_analiz_004 = await prisma.saleItem.findFirst({
    where: { saleId: "sale-ov-004", variantId: "var-analiz-std" },
  });
  if (saleItem_analiz_004) {
    const amount_analiz_004 =
      Number(saleItem_analiz_004.priceAtSale) * saleItem_analiz_004.quantity;

    const settlement_sing_001 = await prisma.settlement.create({
      data: {
        id: "settlement-sing-001",
        ownerId: "own-singularity-labs",
        totalAmount: parseFloat(amount_analiz_004.toFixed(2)),
        createdAt: new Date("2025-02-28T14:00:00Z"),
        items: {
          create: [
            {
              saleItemId: saleItem_analiz_004.id,
              quantity: saleItem_analiz_004.quantity,
              amount: parseFloat(amount_analiz_004.toFixed(2)),
            },
          ],
        },
      },
    });
    totalSettlementsCreated++;

    await prisma.saleItem.update({
      where: { id: saleItem_analiz_004.id },
      data: { settledQuantity: saleItem_analiz_004.quantity },
    });

    await prisma.balanceAdjustment.create({
      data: {
        id: "adj-sing-001-com-alta",
        ownerId: "own-singularity-labs",
        amount: parseFloat((-amount_analiz_004 * 0.12).toFixed(2)),
        description:
          "Comision especial por venta de hardware biometrico de alto valor.",
        isApplied: true,
        settlementId: settlement_sing_001.id,
        createdAt: new Date("2025-02-28T14:30:00Z"),
      },
    });
    totalAdjustmentsCreated++;
  }

  console.log(
    `${totalSettlementsCreated} liquidaciones y ${totalAdjustmentsCreated} ajustes de balance procesados`,
  );
}
