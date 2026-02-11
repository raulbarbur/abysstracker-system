"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StockMovementType, UnitOfMeasure } from "@prisma/client";
import ExcelJS from "exceljs";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  success: false,
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

type ImportRow = {
  name: string;
  variantName?: string;
  categoryName: string;
  ownerName: string;
  cost: number;
  price: number;
  unit?: string;
  stock?: number;
};

type BatchStats = {
  created: number;
  updated: number;
  stockMoves: number;
};

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );
}

function normalizeUnit(input?: string): UnitOfMeasure {
  if (!input) return UnitOfMeasure.UNIT;
  const normalized = input.trim().toUpperCase();
  if (
    ["G", "GR", "GRAMOS", "GRAMO", "KG", "KILO", "PESABLE"].some((x) =>
      normalized.includes(x),
    )
  ) {
    return UnitOfMeasure.GRAM;
  }
  return UnitOfMeasure.UNIT;
}

export async function importProductBatch(rows: ImportRow[]) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: "Lote vacío o inválido." };
  }

  if (rows.length > 200) {
    return {
      success: false,
      error: "Límite de seguridad: Máximo 200 productos por carga.",
    };
  }

  try {
    const stats: BatchStats = { created: 0, updated: 0, stockMoves: 0 };

    await prisma.$transaction(
      async (tx) => {
        const ownerNames = new Set<string>();
        const categoryNames = new Set<string>();
        const productNames = new Set<string>();

        rows.forEach((r) => {
          if (r.ownerName) ownerNames.add(r.ownerName.trim());
          if (r.categoryName)
            categoryNames.add(toTitleCase(r.categoryName.trim()));
          if (r.name) productNames.add(r.name.trim());
        });

        const dbOwners = await tx.owner.findMany({
          where: { name: { in: Array.from(ownerNames), mode: "insensitive" } },
        });
        const ownerMap = new Map<string, string>();
        dbOwners.forEach((o) => ownerMap.set(o.name.toLowerCase(), o.id));

        for (const name of Array.from(ownerNames)) {
          if (!ownerMap.has(name.toLowerCase())) {
            throw new Error(
              `Dueño desconocido: "${name}". Por favor créalo en el sistema primero.`,
            );
          }
        }

        const dbCategories = await tx.category.findMany({
          where: {
            name: { in: Array.from(categoryNames), mode: "insensitive" },
          },
        });
        const categoryMap = new Map<string, string>();
        dbCategories.forEach((c) =>
          categoryMap.set(c.name.toLowerCase(), c.id),
        );

        for (const name of Array.from(categoryNames)) {
          const key = name.toLowerCase();
          if (!categoryMap.has(key)) {
            const newCat = await tx.category.create({ data: { name } });
            categoryMap.set(key, newCat.id);
          }
        }

        const dbProducts = await tx.product.findMany({
          where: {
            name: { in: Array.from(productNames), mode: "insensitive" },
            ownerId: { in: Array.from(ownerMap.values()) },
          },
          include: { variants: true },
        });

        const productMap = new Map<string, any>();
        dbProducts.forEach((p) => {
          const key = `${p.ownerId}|${p.name.toLowerCase()}`;
          productMap.set(key, p);
        });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowIndex = i + 1;

          const name = String(row.name || "").trim();
          const catNameRaw = String(row.categoryName || "").trim();
          const ownerNameRaw = String(row.ownerName || "").trim();
          const cost = Number(row.cost);
          const price = Number(row.price);
          const stockInput = row.stock ? Number(row.stock) : 0;
          const unitType = normalizeUnit(row.unit);

          if (!name || !catNameRaw || !ownerNameRaw)
            throw new Error(
              `Fila ${rowIndex}: Datos incompletos (Nombre, Categoría o Dueño).`,
            );
          if (isNaN(cost) || isNaN(price))
            throw new Error(`Fila ${rowIndex}: Importes inválidos.`);
          if (price < 0 || cost < 0)
            throw new Error(
              `Fila ${rowIndex}: No se permiten importes negativos.`,
            );

          const ownerId = ownerMap.get(ownerNameRaw.toLowerCase());
          const catId = categoryMap.get(toTitleCase(catNameRaw).toLowerCase());

          if (!ownerId || !catId)
            throw new Error(
              `Error interno Fila ${rowIndex}: Referencias perdidas.`,
            );

          const productKey = `${ownerId}|${name.toLowerCase()}`;
          let product = productMap.get(productKey);
          const variantName =
            row.variantName && row.variantName.trim() !== ""
              ? row.variantName.trim()
              : "Estándar";

          let targetVariantId: string = "";

          if (product) {
            if (product.unitOfMeasure !== unitType) {
              if (
                row.unit &&
                normalizeUnit(row.unit) !== product.unitOfMeasure
              ) {
                throw new Error(
                  `Fila ${rowIndex} (${name}): Conflicto de unidad. El producto ya existe como ${product.unitOfMeasure}.`,
                );
              }
            }

            const existingVariant = product.variants.find(
              (v: any) => v.name.toLowerCase() === variantName.toLowerCase(),
            );

            if (existingVariant) {
              await tx.productVariant.update({
                where: { id: existingVariant.id },
                data: {
                  costPrice: cost,
                  salePrice: price,
                },
              });
              targetVariantId = existingVariant.id;
              stats.updated++;
            } else {
              const newVariant = await tx.productVariant.create({
                data: {
                  productId: product.id,
                  name: variantName,
                  costPrice: cost,
                  salePrice: price,
                  stock: 0,
                },
              });
              product.variants.push(newVariant);
              targetVariantId = newVariant.id;
              stats.created++;
            }
          } else {
            const newProduct = await tx.product.create({
              data: {
                name: name,
                categoryId: catId,
                ownerId: ownerId,
                isActive: true,
                unitOfMeasure: unitType,
                variants: {
                  create: {
                    name: variantName,
                    costPrice: cost,
                    salePrice: price,
                    stock: 0,
                  },
                },
              },
              include: { variants: true },
            });
            productMap.set(productKey, newProduct);
            targetVariantId = newProduct.variants[0].id;
            stats.created++;
          }

          if (stockInput !== 0) {
            await tx.productVariant.update({
              where: { id: targetVariantId },
              data: { stock: { increment: stockInput } },
            });

            await tx.stockMovement.create({
              data: {
                variantId: targetVariantId,
                quantity: stockInput,
                type: StockMovementType.ENTRY,
                reason: `Carga Masiva Excel - Lote #${rowIndex}`,
                userId: session.userId,
              },
            });
            stats.stockMoves++;
          }
        }
      },
      {
        timeout: 20000,
      },
    );

    return { success: true, count: rows.length, stats };
  } catch (error: any) {
    console.error("Error en batch:", error);
    return {
      success: false,
      error: error.message || "Error procesando el lote.",
    };
  }
}

export async function generateBulkTemplate() {
  const session = await getSession();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        owner: true,
        variants: true,
      },
      orderBy: { name: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventario");

    worksheet.columns = [
      { header: "Nombre Producto", key: "name", width: 30 },
      { header: "Variante (Opcional)", key: "variantName", width: 20 },
      { header: "Categoria", key: "category", width: 20 },
      { header: "Dueño", key: "owner", width: 15 },
      { header: "Costo", key: "cost", width: 12 },
      { header: "Precio Venta", key: "price", width: 12 },
      { header: "Stock (+/-)", key: "stockAdjustment", width: 15 },
      { header: "Unidad", key: "unit", width: 10 },
      { header: "Stock Actual (Info)", key: "currentStock", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };

    for (const p of products) {
      if (p.variants.length === 0) continue;

      for (const v of p.variants) {
        const row = worksheet.addRow({
          name: p.name,
          variantName: v.name === "Estándar" ? "" : v.name,
          category: p.category.name,
          owner: p.owner.name,
          cost: Number(v.costPrice),
          price: Number(v.salePrice),
          stockAdjustment: 0,
          unit: p.unitOfMeasure === "GRAM" ? "Gramos" : "Unidad",
          currentStock: v.stock,
        });

        const stockCell = row.getCell(9);
        stockCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };
        stockCell.font = { color: { argb: "FF64748B" }, italic: true };
      }
    }

    if (products.length === 0) {
      worksheet.addRow({
        name: "Ejemplo Producto",
        variantName: "10kg",
        category: "Ejemplo Categoria",
        owner: "Ejemplo Dueño",
        cost: 10000,
        price: 15000,
        stockAdjustment: 10,
        unit: "Unidad",
        currentStock: 0,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      success: true,
      base64: Buffer.from(buffer).toString("base64"),
      filename: `Inventario_${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  } catch (error) {
    console.error("Error generating xlsx:", error);
    return {
      success: false,
      error: "Error interno al generar el archivo Excel.",
    };
  }
}
