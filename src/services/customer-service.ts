import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getPaginatedCustomers(params: {
  query?: string;
  filter?: string;
  page: number;
  pageSize: number;
}) {
  const { query, filter, page, pageSize } = params;
  const skip = (page - 1) * pageSize;

  const whereCondition: Prisma.CustomerWhereInput = {
    AND: [{ isActive: filter === "archived" ? false : true }],
  };

  if (query) {
    (whereCondition.AND as any).push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (filter === "debt") {
    (whereCondition.AND as any).push({
      sales: {
        some: {
          status: "COMPLETED",
          paymentStatus: "PENDING",
        },
      },
    });
  }

  const [totalItems, customers] = await Promise.all([
    prisma.customer.count({ where: whereCondition }),
    prisma.customer.findMany({
      where: whereCondition,
      take: pageSize,
      skip: skip,
      include: {
        sales: {
          where: {
            status: "COMPLETED",
            paymentStatus: "PENDING",
          },
          select: { total: true },
        },
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const customersWithDebt = customers.map((c) => {
    const debt = c.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return { ...c, currentDebt: debt };
  });

  return {
    customers: customersWithDebt,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}
