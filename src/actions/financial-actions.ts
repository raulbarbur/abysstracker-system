"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnitOfMeasure } from "@prisma/client";

const round = (num: number) => Math.round(num * 100) / 100;

async function validateAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error(
      "Acceso restringido. Se requieren permisos de Administrador.",
    );
  }
  return session;
}

export async function getMonthlyFinancialReport(year: number, month: number) {
  try {
    await validateAdmin();
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { unitOfMeasure: true },
                },
              },
            },
          },
        },
      },
    });

    let revenue = 0;
    let cogs = 0;
    let totalUnitsSold = 0;

    for (const sale of sales) {
      revenue = round(revenue + Number(sale.total));
      for (const item of sale.items) {
        const isGram =
          item.variant?.product?.unitOfMeasure === UnitOfMeasure.GRAM;
        totalUnitsSold += isGram ? 1 : item.quantity;
        if (item.variantId) {
          const quantityFactor = isGram ? item.quantity / 1000 : item.quantity;
          const itemTotalCost = round(Number(item.costAtSale) * quantityFactor);
          cogs = round(cogs + itemTotalCost);
        }
      }
    }

    const netIncome = round(revenue - cogs);
    const marginPercent = revenue > 0 ? round((netIncome / revenue) * 100) : 0;

    return {
      success: true,
      data: {
        period: { year, month },
        metrics: {
          revenue,
          cogs,
          netIncome,
          marginPercent,
          transactionCount: sales.length,
          totalUnitsSold,
        },
        generatedAt: new Date(),
      },
    };
  } catch (error: any) {
    return { error: error.message || "Error interno." };
  }
}

export async function getInventoryValuation() {
  try {
    await validateAdmin();

    const variants = await prisma.productVariant.findMany({
      where: {
        stock: { gt: 0 },
        product: { isActive: true },
      },
      include: {
        product: { select: { id: true, unitOfMeasure: true } },
      },
    });

    let totalCost = 0;
    let totalRetail = 0;
    let totalStockUnits = 0;

    variants.forEach((v) => {
      const isGram = v.product.unitOfMeasure === UnitOfMeasure.GRAM;
      const stockFactor = isGram ? v.stock / 1000 : v.stock;
      totalCost += stockFactor * Number(v.costPrice);
      totalRetail += stockFactor * Number(v.salePrice);
      totalStockUnits += isGram ? 1 : v.stock;
    });

    const totalProducts = new Set(variants.map((v) => v.product.id)).size;

    return {
      success: true,
      data: {
        cost: round(totalCost),
        retail: round(totalRetail),
        margin: round(totalRetail - totalCost),
        totalStock: totalStockUnits,
        totalProducts: totalProducts,
      },
    };
  } catch (error: any) {
    return { success: false, error: "Error en valuación." };
  }
}

export async function getDetailedInventoryBreakdown() {
  try {
    await validateAdmin();
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        owner: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        variants: {
          where: { stock: { gt: 0 } },
          select: { stock: true, costPrice: true, salePrice: true },
        },
      },
    });

    const ownerMap: Record<
      string,
      { name: string; cost: number; retail: number; stock: number }
    > = {};
    const categoryMap: Record<
      string,
      { name: string; cost: number; retail: number; stock: number }
    > = {};

    products.forEach((p) => {
      if (p.variants.length === 0) return;
      const isGram = p.unitOfMeasure === UnitOfMeasure.GRAM;
      const pStockFactor = p.variants.reduce((sum, v) => sum + v.stock, 0);
      const pMonetaryFactor = isGram ? pStockFactor / 1000 : pStockFactor;
      const pCost = p.variants.reduce(
        (sum, v) =>
          sum + (isGram ? v.stock / 1000 : v.stock) * Number(v.costPrice),
        0,
      );
      const pRetail = p.variants.reduce(
        (sum, v) =>
          sum + (isGram ? v.stock / 1000 : v.stock) * Number(v.salePrice),
        0,
      );
      const pStockUnits = isGram ? 1 : pStockFactor;

      if (!ownerMap[p.ownerId])
        ownerMap[p.ownerId] = {
          name: p.owner.name,
          cost: 0,
          retail: 0,
          stock: 0,
        };
      ownerMap[p.ownerId].cost = round(ownerMap[p.ownerId].cost + pCost);
      ownerMap[p.ownerId].retail = round(ownerMap[p.ownerId].retail + pRetail);
      ownerMap[p.ownerId].stock += pStockUnits;

      if (!categoryMap[p.categoryId])
        categoryMap[p.categoryId] = {
          name: p.category.name,
          cost: 0,
          retail: 0,
          stock: 0,
        };
      categoryMap[p.categoryId].cost = round(
        categoryMap[p.categoryId].cost + pCost,
      );
      categoryMap[p.categoryId].retail = round(
        categoryMap[p.categoryId].retail + pRetail,
      );
      categoryMap[p.categoryId].stock += pStockUnits;
    });

    return {
      success: true,
      data: {
        byOwner: Object.values(ownerMap).sort((a, b) => b.cost - a.cost),
        byCategory: Object.values(categoryMap).sort((a, b) => b.cost - a.cost),
      },
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getSalesByCategoryReport(year: number, month: number) {
  try {
    await validateAdmin();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      },
      include: {
        variant: { include: { product: { include: { category: true } } } },
      },
    });

    const categoryMap: Record<
      string,
      { name: string; total: number; cogs: number; quantity: number }
    > = {};

    items.forEach((item) => {
      const cat = item.variant?.product?.category;
      const catId = cat?.id || "unassigned";
      const catName = cat?.name || "Sin Categoría";
      const isGram =
        item.variant?.product?.unitOfMeasure === UnitOfMeasure.GRAM;
      const quantityFactor = isGram ? item.quantity / 1000 : item.quantity;

      if (!categoryMap[catId])
        categoryMap[catId] = { name: catName, total: 0, cogs: 0, quantity: 0 };
      categoryMap[catId].total = round(
        categoryMap[catId].total + Number(item.priceAtSale) * quantityFactor,
      );
      categoryMap[catId].cogs = round(
        categoryMap[catId].cogs + Number(item.costAtSale) * quantityFactor,
      );
      categoryMap[catId].quantity += isGram ? 1 : item.quantity;
    });

    return {
      success: true,
      data: Object.values(categoryMap).sort((a, b) => b.total - a.total),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getSalesByOwnerReport(year: number, month: number) {
  try {
    await validateAdmin();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      },
      include: {
        variant: { include: { product: { include: { owner: true } } } },
      },
    });

    const ownerMap: Record<
      string,
      { name: string; total: number; cogs: number; quantity: number }
    > = {};

    items.forEach((item) => {
      const owner = item.variant?.product?.owner;
      const ownerId = owner?.id || "unassigned";
      const ownerName = owner?.name || "Sin Dueño";
      const isGram =
        item.variant?.product?.unitOfMeasure === UnitOfMeasure.GRAM;
      const quantityFactor = isGram ? item.quantity / 1000 : item.quantity;

      if (!ownerMap[ownerId])
        ownerMap[ownerId] = { name: ownerName, total: 0, cogs: 0, quantity: 0 };
      const subtotal = round(Number(item.priceAtSale) * quantityFactor);
      const subtotalCogs = round(Number(item.costAtSale) * quantityFactor);
      ownerMap[ownerId].total = round(ownerMap[ownerId].total + subtotal);
      ownerMap[ownerId].cogs = round(ownerMap[ownerId].cogs + subtotalCogs);
      ownerMap[ownerId].quantity += isGram ? 1 : item.quantity;
    });

    return {
      success: true,
      data: Object.values(ownerMap).sort((a, b) => b.total - a.total),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAnnualSalesReport(year: number) {
  try {
    await validateAdmin();
    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
      include: {
        items: {
          include: {
            variant: {
              select: { product: { select: { unitOfMeasure: true } } },
            },
          },
        },
      },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
      units: 0,
    }));

    sales.forEach((sale) => {
      const monthIdx = sale.createdAt.getMonth();
      monthlyData[monthIdx].total = round(
        monthlyData[monthIdx].total + Number(sale.total),
      );
      monthlyData[monthIdx].count += 1;
      const saleUnits = sale.items.reduce((acc, item) => {
        const isGram =
          item.variant?.product?.unitOfMeasure === UnitOfMeasure.GRAM;
        return acc + (isGram ? 1 : item.quantity);
      }, 0);
      monthlyData[monthIdx].units += saleUnits;
    });

    return { success: true, data: monthlyData };
  } catch (error: any) {
    return { error: error.message };
  }
}
