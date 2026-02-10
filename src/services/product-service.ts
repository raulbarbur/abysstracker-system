import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getPaginatedProducts(params: {
  query?: string;
  page: number;
  pageSize: number;
  ownerId?: string;
  includeArchived?: boolean;
}) {
  const { query, page, pageSize, ownerId, includeArchived } = params;
  const skip = (page - 1) * pageSize;

  const andConditions: Prisma.ProductWhereInput[] = [];

  if (query) {
    andConditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { owner: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  if (ownerId) {
    andConditions.push({ ownerId });
  }

  if (!includeArchived) {
    andConditions.push({ isActive: true });
  }

  const whereCondition: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [totalItems, products] = await Promise.all([
    prisma.product.count({ where: whereCondition }),
    prisma.product.findMany({
      where: whereCondition,
      take: pageSize,
      skip: skip,
      include: {
        variants: true,
        category: true,
        owner: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    products,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}
