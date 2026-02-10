export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getLocalDateISO, getArgentinaDayRange } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import SalesMinimalClient from "@/components/SalesMinimalClient";

type FullSale = {
  id: string;
  createdAt: string;
  paymentMethod: string;
  total: number;
  status: string;
  items: {
    description: string;
    quantity: number;
    priceAtSale: number;
    unitOfMeasure?: string;
  }[];
};

interface SalesData {
  sales: FullSale[];
  totalSalesCount: number;
  totalPeriodo?: number;
  cantVentas?: number;
  error?: string;
}

interface PageProps {
  searchParams: {
    dateFrom?: string;
    dateTo?: string;
    method?: string;
    page?: string;
  };
}

const SALES_PER_PAGE = 20;

const serializeSales = (salesResult: any[]): FullSale[] => {
  return salesResult.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    paymentMethod: s.paymentMethod,
    total: Number(s.total),
    status: s.status,
    items: s.items.map((i: any) => ({
      description: i.description,
      quantity: i.quantity,
      priceAtSale: Number(i.priceAtSale),
      unitOfMeasure: i.variant?.product?.unitOfMeasure || "UNIT",
    })),
  }));
};

export default async function SalesHistoryPage({ searchParams }: PageProps) {
  try {
    const { dateFrom, dateTo, method } = searchParams;
    const currentPage = Number(searchParams.page) || 1;

    const whereClause: Prisma.SaleWhereInput = {
      status: "COMPLETED",
      paymentMethod: method ? { equals: method } : undefined,
    };
    const isDateFiltered = dateFrom || dateTo;
    if (isDateFiltered) {
      const today = getLocalDateISO();
      const finalDateFrom = dateFrom || dateTo || today;
      const finalDateTo = dateTo || dateFrom || today;
      const rangeStart = getArgentinaDayRange(finalDateFrom).start;
      const rangeEnd = getArgentinaDayRange(finalDateTo).end;
      if (rangeStart <= rangeEnd) {
        whereClause.createdAt = { gte: rangeStart, lte: rangeEnd };
      } else {
        whereClause.id = "INVALID_RANGE";
      }
    }

    const salesQuery = prisma.sale.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            description: true,
            quantity: true,
            priceAtSale: true,
            variant: {
              select: {
                product: {
                  select: { unitOfMeasure: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: SALES_PER_PAGE,
      skip: (currentPage - 1) * SALES_PER_PAGE,
    });
    const countQuery = prisma.sale.count({ where: whereClause });

    let salesData: SalesData;
    if (isDateFiltered) {
      const aggregateQuery = prisma.sale.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: whereClause,
      });
      const [salesResult, totalSalesCount, summary] = await prisma.$transaction(
        [salesQuery, countQuery, aggregateQuery],
      );
      salesData = {
        sales: serializeSales(salesResult),
        totalSalesCount,
        totalPeriodo: Number(summary._sum.total) || 0,
        cantVentas: summary._count.id,
      };
    } else {
      const [salesResult, totalSalesCount] = await prisma.$transaction([
        salesQuery,
        countQuery,
      ]);
      salesData = { sales: serializeSales(salesResult), totalSalesCount };
    }

    return <SalesMinimalClient salesData={salesData} />;
  } catch (error: any) {
    console.error("[SERVER LOG] CRITICAL RENDER ERROR in /sales:", error);
    const errorData: SalesData = {
      sales: [],
      totalSalesCount: 0,
      error: error.message || "Un error desconocido ocurrió en el servidor.",
    };
    return <SalesMinimalClient salesData={errorData} />;
  }
}
