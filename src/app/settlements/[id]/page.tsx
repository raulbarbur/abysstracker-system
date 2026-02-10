// src/app/settlements/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import SettlementTicket from "@/components/SettlementTicket";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SettlementDetailPage({ params }: Props) {
  const { id } = await params;

  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      owner: true,
      items: {
        orderBy: {
          saleItem: {
            sale: { createdAt: "desc" },
          },
        },
        include: {
          saleItem: {
            include: {
              sale: true,
            },
          },
        },
      },
      adjustments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!settlement) return notFound();

  const formattedData = {
    id: settlement.id,
    createdAt: settlement.createdAt,
    totalAmount: Number(settlement.totalAmount),
    owner: settlement.owner,

    items: settlement.items.map((line) => ({
      id: line.id,
      description: line.saleItem.description,
      quantity: line.quantity,
      costAtSale: Number(line.saleItem.costAtSale),
      createdAt: line.saleItem.sale.createdAt,
    })),

    adjustments: settlement.adjustments.map((a) => ({
      ...a,
      amount: Number(a.amount),
    })),
  };

  return <SettlementTicket data={formattedData} />;
}
