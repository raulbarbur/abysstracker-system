"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

export async function createCustomer(formData: FormData) {
  if (isDemoMode) return demoError;

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;

  if (!name) return { error: "El nombre es obligatorio" };

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        isActive: true,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/pos");

    return { success: true, customer: newCustomer };
  } catch (error) {
    console.error("Error creando cliente:", error);
    return { error: "Error interno al crear cliente." };
  }
}

export async function updateCustomer(formData: FormData) {
  if (isDemoMode) return demoError;

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;

  if (!id || !name) return { error: "Faltan datos obligatorios." };

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return { error: "Error al actualizar." };
  }
}

export async function deleteCustomer(formData: FormData) {
  if (isDemoMode) return demoError;

  const id = formData.get("id") as string;
  const shouldRestore = formData.get("restore") === "true";

  if (!id) return { error: "ID requerido" };

  try {
    if (shouldRestore) {
      await prisma.customer.update({ where: { id }, data: { isActive: true } });
      revalidatePath("/customers");
      return { success: true };
    }

    const pendingDebts = await prisma.sale.count({
      where: { customerId: id, paymentStatus: "PENDING" },
    });

    if (pendingDebts > 0) {
      return {
        error: "No se puede dar de baja: El cliente tiene deuda activa.",
      };
    }

    const customerWithHistory = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { sales: true } } },
    });

    if (customerWithHistory && customerWithHistory._count.sales > 0) {
      await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await prisma.customer.delete({ where: { id } });
    }

    revalidatePath("/customers");
    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    console.error("Error en baja de cliente:", error);
    return { error: "No se pudo procesar la solicitud." };
  }
}

export async function markSaleAsPaid(saleId: string) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado" };

  try {
    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
      include: { items: true },
    });

    revalidatePath("/customers");
    revalidatePath("/sales");

    return {
      success: true,
      saleData: {
        id: sale.id,
        date: sale.createdAt,
        total: Number(sale.total),
        method: sale.paymentMethod,
        items: sale.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          price: Number(i.priceAtSale),
        })),
      },
    };
  } catch (error) {
    return { error: "Error al registrar el pago." };
  }
}
