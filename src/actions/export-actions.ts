"use server";

import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth";
import { buildArgentinaDate } from "@/lib/utils";

export async function exportProducts(mode: "TEMPLATE" | "FULL") {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Productos");

    worksheet.columns = [
      { header: "Nombre Producto", key: "name", width: 30 },
      { header: "Variante", key: "variant", width: 20 },
      { header: "Categoría", key: "category", width: 20 },
      { header: "Nombre Dueño", key: "owner", width: 20 },
      { header: "Costo", key: "cost", width: 15 },
      { header: "Precio Venta", key: "price", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    if (mode === "FULL") {
      const SAFE_LIMIT = 2000;

      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          owner: true,
          variants: true,
        },
        orderBy: { name: "asc" },
        take: SAFE_LIMIT,
      });

      for (const p of products) {
        for (const v of p.variants) {
          worksheet.addRow({
            name: p.name,
            variant: v.name === "Estándar" ? "" : v.name,
            category: p.category.name,
            owner: p.owner.name,
            cost: Number(v.costPrice),
            price: Number(v.salePrice),
          });
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const filename =
      mode === "FULL"
        ? `Inventario_${new Date().toISOString().split("T")[0]}.xlsx`
        : `Plantilla_Carga_Productos.xlsx`;

    return { success: true, base64, filename };
  } catch (error) {
    console.error("Error exportando productos:", error);
    return { success: false, error: "Error al generar el archivo Excel." };
  }
}

export async function exportSales(
  dateFrom?: string,
  dateTo?: string,
  paymentMethod?: string,
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  try {
    const whereClause: any = {
      status: "COMPLETED",
    };

    if (paymentMethod && paymentMethod !== "ALL") {
      whereClause.paymentMethod = paymentMethod;
    }

    let takeLimit: number | undefined = undefined;

    if (dateFrom && dateTo) {
      const startDate = buildArgentinaDate(dateFrom, "00:00:00");
      const endDateBase = buildArgentinaDate(dateTo, "00:00:00");
      const endDate = new Date(endDateBase.getTime() + 24 * 60 * 60 * 1000 - 1);

      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else {
      takeLimit = 1000;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: takeLimit,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Ventas");

    worksheet.columns = [
      { header: "Fecha", key: "date", width: 15 },
      { header: "Hora", key: "time", width: 10 },
      { header: "ID Venta", key: "id", width: 36 },
      { header: "Método", key: "method", width: 15 },
      { header: "Cliente", key: "customer", width: 25 },
      { header: "Items (Resumen)", key: "items", width: 50 },
      { header: "Total ($)", key: "total", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };

    const methodMap: Record<string, string> = {
      CASH: "Efectivo",
      TRANSFER: "Transferencia",
      CHECKING_ACCOUNT: "Cta. Corriente",
      DEBIT: "Débito",
      CREDIT: "Crédito",
    };

    for (const sale of sales) {
      const dateObj = new Date(sale.createdAt);
      const localDate = new Date(dateObj.getTime() - 3 * 60 * 60 * 1000);

      const dateStr = localDate.toISOString().split("T")[0];
      const timeStr = localDate.toISOString().split("T")[1].substring(0, 5);

      const itemsSummary = sale.items
        .map((i) => `${i.quantity}x ${i.description}`)
        .join(" + ");

      worksheet.addRow({
        date: dateStr,
        time: timeStr,
        id: sale.id,
        method: methodMap[sale.paymentMethod] || sale.paymentMethod,
        customer: sale.customer ? sale.customer.name : "Consumidor Final",
        items: itemsSummary,
        total: Number(sale.total),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Reporte_Ventas_${dateFrom || "Ultimas"}_${dateTo || ""}.xlsx`;

    return { success: true, base64, filename };
  } catch (error) {
    console.error("Error exportando ventas:", error);
    return { success: false, error: "Error generando reporte de ventas." };
  }
}

export async function exportOwnersBalance() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  try {
    const pendingItems = await prisma.saleItem.findMany({
      where: {
        settledQuantity: { lt: prisma.saleItem.fields.quantity },
        sale: {
          status: "COMPLETED",
          paymentStatus: "PAID",
        },
        variantId: { not: null },
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    const balanceMap = new Map<string, any>();

    for (const item of pendingItems) {
      if (!item.variant?.product?.owner) continue;

      const owner = item.variant.product.owner;
      const quantityPending = item.quantity - item.settledQuantity;
      const debtAmount = quantityPending * Number(item.costAtSale);

      if (!balanceMap.has(owner.id)) {
        balanceMap.set(owner.id, {
          name: owner.name,
          phone: owner.phone || "-",
          itemsCount: 0,
          totalDebt: 0,
        });
      }

      const entry = balanceMap.get(owner.id);
      entry.itemsCount += quantityPending;
      entry.totalDebt += debtAmount;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Estado de Deuda");

    worksheet.columns = [
      { header: "Dueño / Proveedor", key: "name", width: 30 },
      { header: "Teléfono", key: "phone", width: 20 },
      { header: "Items Pendientes de Pago", key: "count", width: 25 },
      { header: "Saldo Total a Pagar ($)", key: "debt", width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC0504D" },
    };

    const rows = Array.from(balanceMap.values()).sort(
      (a, b) => b.totalDebt - a.totalDebt,
    );

    for (const row of rows) {
      worksheet.addRow({
        name: row.name,
        phone: row.phone,
        count: row.itemsCount,
        debt: row.totalDebt,
      });
    }

    const grandTotal = rows.reduce((sum, r) => sum + r.totalDebt, 0);
    worksheet.addRow({});
    const totalRow = worksheet.addRow({
      name: "TOTAL PASIVOS",
      debt: grandTotal,
    });
    totalRow.font = { bold: true, size: 12 };

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Pasivos_Dueños_${new Date().toISOString().split("T")[0]}.xlsx`;

    return { success: true, base64, filename };
  } catch (error) {
    console.error("Error exportando pasivos:", error);
    return { success: false, error: "Error calculando deuda a proveedores." };
  }
}

export async function exportCustomers() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          where: { paymentStatus: "PENDING", status: "COMPLETED" },
          select: { total: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = customers.map((c) => {
      const totalDebt = c.sales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0,
      );
      return {
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        address: c.address || "",
        debt: totalDebt,
      };
    });

    data.sort((a, b) => b.debt - a.debt);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clientes y Deudas");

    worksheet.columns = [
      { header: "Nombre Cliente", key: "name", width: 30 },
      { header: "Teléfono", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Dirección", key: "address", width: 30 },
      { header: "Deuda Corriente ($)", key: "debt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9BBB59" },
    };

    for (const row of data) {
      worksheet.addRow({
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        debt: row.debt,
      });

      if (row.debt > 0) {
        const lastRow = worksheet.lastRow;
        if (lastRow) {
          lastRow.getCell("debt").font = {
            color: { argb: "FFFF0000" },
            bold: true,
          };
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Clientes_Deuda_${new Date().toISOString().split("T")[0]}.xlsx`;

    return { success: true, base64, filename };
  } catch (error) {
    console.error("Error exportando clientes:", error);
    return { success: false, error: "Error generando reporte de clientes." };
  }
}

export async function exportAppointments(dateFrom?: string, dateTo?: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  try {
    const whereClause: any = {};

    if (dateFrom && dateTo) {
      const startDate = buildArgentinaDate(dateFrom, "00:00:00");
      const endDateBase = buildArgentinaDate(dateTo, "00:00:00");
      const endDate = new Date(endDateBase.getTime() + 24 * 60 * 60 * 1000 - 1);

      whereClause.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        pet: true,
      },
      orderBy: { startTime: "desc" },
      take: dateFrom && dateTo ? undefined : 1000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Agenda de Turnos");

    worksheet.columns = [
      { header: "Fecha", key: "date", width: 15 },
      { header: "Hora", key: "time", width: 10 },
      { header: "Mascota", key: "pet", width: 20 },
      { header: "Dueño Mascota", key: "owner", width: 25 },
      { header: "Teléfono", key: "phone", width: 20 },
      { header: "Estado", key: "status", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF8064A2" },
    };

    const statusMap: Record<string, string> = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Completado",
      BILLED: "Cobrado",
      CANCELLED: "Cancelado",
    };

    for (const appt of appointments) {
      const dateObj = new Date(appt.startTime);
      const localDate = new Date(dateObj.getTime() - 3 * 60 * 60 * 1000);

      const dateStr = localDate.toISOString().split("T")[0];
      const timeStr = localDate.toISOString().split("T")[1].substring(0, 5);

      worksheet.addRow({
        date: dateStr,
        time: timeStr,
        pet: appt.pet.name,
        owner: appt.pet.ownerName,
        phone: appt.pet.ownerPhone || "",
        status: statusMap[appt.status] || appt.status,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Agenda_Turnos_${dateFrom || "Ultimos"}_${dateTo || ""}.xlsx`;

    return { success: true, base64, filename };
  } catch (error) {
    console.error("Error exportando agenda:", error);
    return { success: false, error: "Error generando reporte de agenda." };
  }
}
export async function exportStockHistory(filters: {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  search?: string;
  userId?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Requiere permisos de Administrador." };
  }

  try {
    const whereClause: any = {};

    if (filters.dateFrom || filters.dateTo) {
      const startDate = filters.dateFrom
        ? buildArgentinaDate(filters.dateFrom, "00:00:00")
        : new Date(0);
      const endDateBase = filters.dateTo
        ? buildArgentinaDate(filters.dateTo, "00:00:00")
        : new Date();
      const endDate = new Date(endDateBase.getTime() + 24 * 60 * 60 * 1000 - 1);
      whereClause.createdAt = { gte: startDate, lte: endDate };
    }
    if (filters.type && filters.type !== "ALL") {
      whereClause.type = filters.type;
    }
    if (filters.userId && filters.userId !== "ALL") {
      whereClause.userId = filters.userId;
    }
    if (filters.search) {
      whereClause.variant = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          {
            product: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      };
    }

    const LIMIT = 5000;

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        variant: {
          include: {
            product: {
              select: { name: true, unitOfMeasure: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    });

    const userIds = [
      ...new Set(movements.map((m) => m.userId).filter(Boolean)),
    ];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(
      users.map((user) => [user.id, user.name || "Usuario Anónimo"]),
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Historial de Stock");

    worksheet.columns = [
      { header: "Fecha", key: "date", width: 15 },
      { header: "Hora", key: "time", width: 10 },
      { header: "Producto", key: "product", width: 30 },
      { header: "Variante", key: "variant", width: 20 },
      { header: "Tipo Movimiento", key: "type", width: 20 },
      { header: "Cantidad", key: "quantity", width: 15 },
      { header: "Motivo / Detalle", key: "reason", width: 30 },
      { header: "Usuario", key: "user", width: 25 },
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFED7D31" },
    };

    const typeMap: Record<string, string> = {
      ENTRY: "Ingreso",
      SALE: "Venta",
      ADJUSTMENT: "Ajuste Manual",
      OWNER_WITHDRAWAL: "Retiro Dueño",
      RETURN: "Devolución",
      SALE_CANCELLED: "Anulación Venta",
    };

    for (const m of movements) {
      const dateObj = new Date(m.createdAt);
      const localDate = new Date(dateObj.getTime() - 3 * 60 * 60 * 1000);
      const dateStr = localDate.toISOString().split("T")[0];
      const timeStr = localDate.toISOString().split("T")[1].substring(0, 5);
      const productName = m.variant.product.name;
      const variantName = m.variant.name === "Estándar" ? "-" : m.variant.name;
      worksheet.addRow({
        date: dateStr,
        time: timeStr,
        product: productName,
        variant: variantName,
        type: typeMap[m.type] || m.type,
        quantity: m.quantity,
        reason: m.reason || "-",
        user: userMap.get(m.userId) || "Desconocido",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `Historial_Stock_${new Date().toISOString().split("T")[0]}.xlsx`;

    return { success: true, base64, filename };
  } catch (error) {
    console.error("Error exportando historial stock:", error);
    return { success: false, error: "Error generando reporte de stock." };
  }
}
