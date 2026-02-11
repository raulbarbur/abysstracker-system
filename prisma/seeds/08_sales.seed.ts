import { PrismaClient, PaymentStatus, StockMovementType } from "@prisma/client";

async function updateStockAndCreateMovements(
  prisma: PrismaClient,
  saleId: string,
  saleItems: { variantId: string; quantity: number; description: string }[],
  userId: string,
  saleDate: Date,
) {
  for (const item of saleItems) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      select: { stock: true, name: true },
    });

    if (!variant || variant.stock < item.quantity) {
      item.quantity = variant?.stock || 0;
      if (item.quantity === 0) continue;
    }

    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { decrement: item.quantity } },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: item.variantId,
        quantity: item.quantity,
        type: StockMovementType.SALE,
        reason: `Venta Abyss #${saleId.slice(0, 8)}`,
        userId: userId,
        createdAt: saleDate,
      },
    });
  }
}

export async function seedSales(prisma: PrismaClient) {
  const salesStaff = await prisma.user.findUnique({
    where: { id: "u-staff-marcus" },
  });
  if (!salesStaff) return;

  const allVariants = await prisma.productVariant.findMany({
    include: { product: true },
  });
  if (allVariants.length === 0) return;

  const getVariant = (id: string) => allVariants.find((v) => v.id === id);

  const salesData = [
    {
      id: "sale-ov-001",
      customerId: "cust-ent-gamma",
      createdAt: new Date("2025-01-10T10:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-grn-1kg", quantity: 2, description: "" },
        { variantId: "var-shamp-250ml", quantity: 2, description: "" },
      ],
    },
    {
      id: "sale-ov-002",
      customerId: "cust-consorcio-delta",
      createdAt: new Date("2025-01-25T11:30:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PENDING,
      items: [{ variantId: "var-conc-500g", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-003",
      customerId: "cust-agente-sombra",
      createdAt: new Date("2025-02-05T14:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [
        { variantId: "var-arnes-m", quantity: 1, description: "" },
        { variantId: "var-correa-1_5m", quantity: 1, description: "" },
        { variantId: "var-toallas-20p", quantity: 3, description: "" },
      ],
    },
    {
      id: "sale-ov-004",
      customerId: "cust-operador-echo",
      createdAt: new Date("2025-02-20T09:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-supl-100g", quantity: 1, description: "" },
        { variantId: "var-analiz-std", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-005",
      customerId: "cust-protocolo-zenit",
      createdAt: new Date("2025-03-05T16:00:00Z"),
      paymentMethod: "CHECKING_ACCOUNT",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-simulador-lite", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-006",
      customerId: "cust-observador-03",
      createdAt: new Date("2025-03-15T10:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { variantId: "var-barras-10p", quantity: 5, description: "" },
        { variantId: "var-hidr-500ml", quantity: 10, description: "" },
      ],
    },
    {
      id: "sale-ov-007",
      customerId: "cust-red-spectral",
      createdAt: new Date("2025-04-02T13:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-grn-5kg", quantity: 1, description: "" },
        { variantId: "var-acond-500ml", quantity: 3, description: "" },
        { variantId: "var-disp-compacto", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-008",
      customerId: "cust-vanguardia-alpha",
      createdAt: new Date("2025-04-18T15:00:00Z"),
      paymentMethod: "CHECKING_ACCOUNT",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [
        { variantId: "var-comedero-avanzado", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-009",
      customerId: "cust-enlace-omicron",
      createdAt: new Date("2025-05-10T09:30:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-form-1kg", quantity: 2, description: "" },
        { variantId: "var-gel-50g", quantity: 5, description: "" },
      ],
    },
    {
      id: "sale-ov-010",
      customerId: "cust-unidad-nova",
      createdAt: new Date("2025-05-25T11:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-pista-basica", quantity: 1, description: "" },
        { variantId: "var-guia-anual", quantity: 1, description: "" },
        { variantId: "var-placas-acero", quantity: 2, description: "" },
      ],
    },
    {
      id: "sale-ov-011",
      customerId: "cust-centinela-echo",
      createdAt: new Date("2025-06-05T14:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PENDING,
      items: [{ variantId: "var-manta-std", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-012",
      customerId: "cust-explorador-zeta",
      createdAt: new Date("2025-06-20T10:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-grn-5kg", quantity: 2, description: "" },
        { variantId: "var-spray-200ml", quantity: 4, description: "" },
      ],
    },
    {
      id: "sale-ov-013",
      customerId: "cust-arquitecto-nx",
      createdAt: new Date("2025-07-10T12:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [
        { variantId: "var-simulador-pro", quantity: 1, description: "" },
        { variantId: "var-disp-premium", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-014",
      customerId: "cust-guardian-temporal",
      createdAt: new Date("2025-07-25T15:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-perfume-100ml", quantity: 1, description: "" },
        { variantId: "var-collar-luz-m", quantity: 2, description: "" },
        { variantId: "var-placas-titanio", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-015",
      customerId: "cust-ent-gamma",
      createdAt: new Date("2025-08-05T09:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-alim-terap-500g", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-016",
      customerId: "cust-consorcio-delta",
      createdAt: new Date("2025-08-20T11:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { variantId: "var-bandas-l", quantity: 1, description: "" },
        { variantId: "var-acond-250ml", quantity: 2, description: "" },
      ],
    },
    {
      id: "sale-ov-017",
      customerId: "cust-agente-sombra",
      createdAt: new Date("2025-09-05T14:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-conc-1kg", quantity: 1, description: "" },
        { variantId: "var-shamp-500ml", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-018",
      customerId: "cust-operador-echo",
      createdAt: new Date("2025-09-25T10:00:00Z"),
      paymentMethod: "CHECKING_ACCOUNT",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [{ variantId: "var-guia-perpetua", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-019",
      customerId: "cust-protocolo-zenit",
      createdAt: new Date("2025-10-05T16:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-grn-10kg", quantity: 1, description: "" },
        { variantId: "var-comedero-basico", quantity: 1, description: "" },
        { variantId: "var-pista-expansion", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-020",
      customerId: "cust-observador-03",
      createdAt: new Date("2025-10-20T10:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PENDING,
      items: [{ variantId: "var-collar-luz-l", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-021",
      customerId: "cust-red-spectral",
      createdAt: new Date("2025-11-05T13:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-barras-20p", quantity: 2, description: "" },
        { variantId: "var-hidr-500ml", quantity: 5, description: "" },
      ],
    },
    {
      id: "sale-ov-022",
      customerId: "cust-vanguardia-alpha",
      createdAt: new Date("2025-11-20T15:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [{ variantId: "var-arnes-s", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-023",
      customerId: "cust-enlace-omicron",
      createdAt: new Date("2025-12-05T09:30:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { variantId: "var-supl-500g", quantity: 1, description: "" },
        { variantId: "var-gel-100g", quantity: 2, description: "" },
      ],
    },
    {
      id: "sale-ov-024",
      customerId: "cust-unidad-nova",
      createdAt: new Date("2025-12-15T11:00:00Z"),
      paymentMethod: "CHECKING_ACCOUNT",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [{ variantId: "var-disp-compacto", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-025",
      customerId: "cust-centinela-echo",
      createdAt: new Date("2025-12-30T14:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-manta-reforzada", quantity: 1, description: "" },
        { variantId: "var-correa-3m", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-026",
      customerId: "cust-explorador-zeta",
      createdAt: new Date("2026-01-05T10:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PAID,
      items: [{ variantId: "var-grn-5kg", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-027",
      customerId: "cust-arquitecto-nx",
      createdAt: new Date("2026-01-15T12:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { variantId: "var-simulador-pro", quantity: 1, description: "" },
        { variantId: "var-guia-anual", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-028",
      customerId: "cust-guardian-temporal",
      createdAt: new Date("2026-01-25T15:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [
        { variantId: "var-comedero-basico", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-029",
      customerId: "cust-agente-sombra",
      createdAt: new Date("2026-02-02T09:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-conc-1kg", quantity: 1, description: "" },
        { variantId: "var-acond-500ml", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-030",
      customerId: "cust-consorcio-delta",
      createdAt: new Date("2026-02-05T11:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [{ variantId: "var-shamp-500ml", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-031",
      customerId: "cust-ent-gamma",
      createdAt: new Date("2026-02-08T13:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { variantId: "var-grn-5kg", quantity: 1, description: "" },
        { variantId: "var-toallas-50p", quantity: 1, description: "" },
        { variantId: "var-arnes-l", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-032",
      customerId: "cust-operador-echo",
      createdAt: new Date("2026-02-10T15:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-form-1kg", quantity: 1, description: "" },
        { variantId: "var-perfume-recarga", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-033",
      customerId: "cust-protocolo-zenit",
      createdAt: new Date("2026-02-12T10:00:00Z"),
      paymentMethod: "CHECKING_ACCOUNT",
      paymentStatus: PaymentStatus.PARTIAL,
      items: [{ variantId: "var-disp-premium", quantity: 1, description: "" }],
    },
    {
      id: "sale-ov-034",
      customerId: "cust-observador-03",
      createdAt: new Date("2026-02-15T12:00:00Z"),
      paymentMethod: "TRANSFER",
      paymentStatus: PaymentStatus.PAID,
      items: [
        { variantId: "var-hidr-500ml", quantity: 3, description: "" },
        { variantId: "var-spray-500ml", quantity: 1, description: "" },
      ],
    },
    {
      id: "sale-ov-035",
      customerId: "cust-red-spectral",
      createdAt: new Date("2026-02-18T14:00:00Z"),
      paymentMethod: "CASH",
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { variantId: "var-alim-terap-500g", quantity: 1, description: "" },
        { variantId: "var-bandas-m", quantity: 1, description: "" },
      ],
    },
  ];

  for (const saleData of salesData) {
    let saleTotal = 0;
    const saleItemsWithPrices = saleData.items.map((item) => {
      const variant = getVariant(item.variantId);
      if (!variant) throw new Error(`Variante no encontrada.`);
      const costPrice = variant.costPrice;
      const priceAtSale = variant.salePrice;
      saleTotal += Number(priceAtSale) * item.quantity;
      return {
        variantId: item.variantId,
        description: variant.name,
        quantity: item.quantity,
        costAtSale: costPrice,
        priceAtSale: priceAtSale,
        settledQuantity: 0,
      };
    });

    const sale = await prisma.sale.upsert({
      where: { id: saleData.id },
      update: {
        customerId: saleData.customerId,
        createdAt: saleData.createdAt,
        total: parseFloat(saleTotal.toFixed(2)),
        paymentMethod: saleData.paymentMethod,
        paymentStatus: saleData.paymentStatus,
        status: "COMPLETED",
      },
      create: {
        id: saleData.id,
        customerId: saleData.customerId,
        createdAt: saleData.createdAt,
        total: parseFloat(saleTotal.toFixed(2)),
        paymentMethod: saleData.paymentMethod,
        paymentStatus: saleData.paymentStatus,
        status: "COMPLETED",
        items: { create: saleItemsWithPrices },
      },
    });

    await updateStockAndCreateMovements(
      prisma,
      sale.id,
      saleItemsWithPrices,
      salesStaff.id,
      sale.createdAt,
    );
  }

  console.log(`${salesData.length} ventas agregadas`);
}
