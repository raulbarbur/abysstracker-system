"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

export async function createPet(formData: FormData) {
  if (isDemoMode) return demoError;
  const session = await getSession();
  if (!session) return { error: "No autorizado" };

  const name = formData.get("name") as string;
  const breed = formData.get("breed") as string;
  const ownerName = formData.get("ownerName") as string;
  const ownerPhone = formData.get("ownerPhone") as string;
  const notes = formData.get("notes") as string;

  if (!name || !ownerName || !ownerPhone) {
    return { error: "Faltan datos obligatorios (Nombre, Dueño, Teléfono)" };
  }

  try {
    await prisma.pet.create({
      data: {
        name,
        breed: breed || "Mestizo",
        ownerName,
        ownerPhone,
        notes,
      },
    });

    revalidatePath("/pets");
    return { success: true };
  } catch (error) {
    console.error("Error creando mascota:", error);
    return { error: "Error al guardar la ficha." };
  }
}

export async function deletePet(id: string) {
  if (isDemoMode)
    throw new Error(
      "Modo Demo: Las acciones de escritura están deshabilitadas.",
    );

  const session = await getSession();
  if (!session) {
    throw new Error("No autorizado");
  }

  try {
    await prisma.pet.delete({ where: { id } });
    revalidatePath("/pets");
    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "No se puede eliminar: la mascota tiene historial asociado.",
      );
    }

    console.error("Error eliminando mascota:", error);
    throw new Error("Error inesperado al intentar eliminar la mascota.");
  }
}
