"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function createCategory(formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "No autorizado" };
  }

  const rawName = formData.get("name") as string;
  const name = rawName?.trim();

  if (!name) {
    return {
      success: false,
      error: "El nombre de la categoría es obligatorio",
    };
  }

  try {
    await prisma.category.create({
      data: { name },
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Error creando categoría:", error);

    if (error.code === "P2002") {
      return { success: false, error: "Esta categoría ya existe" };
    }

    return { success: false, error: "Error interno al crear la categoría" };
  }
}

export async function updateCategory(id: string, newName: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "No autorizado" };

  const name = newName?.trim();
  if (!name) return { success: false, error: "El nombre no puede estar vacío" };

  try {
    await prisma.category.update({
      where: { id },
      data: { name },
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Ya existe otra categoría con este nombre",
      };
    }
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: Hay ${productsCount} productos asignados a esta categoría.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    return { success: false, error: "Error interno al eliminar la categoría" };
  }
}
