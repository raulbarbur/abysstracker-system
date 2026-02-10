import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SettlementForm from "@/components/SettlementForm";
import { Icon } from "@/components/ui/Icon";
import { UnitOfMeasure } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SettlementPage({ params }: Props) {
  const { id } = await params;

  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          variants: {
            include: {
              saleItems: {
                where: {
                  sale: {
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                  },
                },
                include: { sale: true },
              },
            },
          },
        },
      },
      balanceAdjustments: { where: { isApplied: false } },
    },
  });

  if (!owner) {
    return <div className="p-10 text-center">Dueño no encontrado</div>;
  }

  const aggregatedItems = new Map();

  owner.products.forEach((p) => {
    p.variants.forEach((v) => {
      v.saleItems.forEach((item) => {
        const pendingQty = item.quantity - item.settledQuantity;
        if (pendingQty <= 0) return;

        const variantId = v.id;
        if (!aggregatedItems.has(variantId)) {
          aggregatedItems.set(variantId, {
            id: variantId,
            type: "SALE",
            description: item.description,
            cost: Number(item.costAtSale),
            unitOfMeasure: p.unitOfMeasure,
            totalPendingQuantity: 0,
            sourceItems: [],
            date: item.sale.createdAt,
          });
        }

        const aggItem = aggregatedItems.get(variantId);
        aggItem.totalPendingQuantity += pendingQty;
        aggItem.sourceItems.push({
          id: item.id,
          pendingQty: pendingQty,
          date: item.sale.createdAt,
        });
      });
    });
  });

  const finalSaleItems = Array.from(aggregatedItems.values());

  const adjustmentItems = owner.balanceAdjustments.map((adj) => ({
    id: adj.id,
    type: "ADJUSTMENT",
    date: adj.createdAt,
    description: `AJUSTE: ${adj.description}`,
    totalPendingQuantity: 1,
    cost: Number(adj.amount),
    isAdjustment: true,
    sourceItems: [],
  }));

  const allItems = [...finalSaleItems, ...adjustmentItems];
  allItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <Link
          href="/owners/balance"
          className="text-sm font-bold text-primary hover:underline mb-2 flex items-center gap-1"
        >
          <Icon name="chevronLeft" className="w-4 h-4" />
          Volver al Balance General
        </Link>
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">
          Liquidación: {owner.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seleccioná los ítems agrupados que querés pagar.
        </p>
      </div>

      {allItems.length > 0 ? (
        <SettlementForm ownerId={owner.id} items={allItems} />
      ) : (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-8 rounded-3xl font-bold border border-green-500/20 text-center text-lg flex flex-col items-center gap-2">
          <Icon name="check" className="w-10 h-10" />
          ¡Excelente! Este dueño no tiene saldos pendientes.
        </div>
      )}
    </div>
  );
}
