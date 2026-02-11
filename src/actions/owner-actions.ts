"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

export async function createOwner(formData: FormData) {
  if (isDemoMode) return demoError;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name) return { error: "El nombre es obligatorio" };

  try {
    await prisma.owner.create({
      data: { name, email, phone, isActive: true },
    });
    revalidatePath("/owners");
    return { success: true };
  } catch (error) {
    return { error: "Error creando dueño" };
  }
}

export async function updateOwner(formData: FormData) {
  if (isDemoMode) return demoError;

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!id || !name) return { error: "Faltan datos" };

  try {
    await prisma.owner.update({
      where: { id },
      data: { name, email, phone },
    });

    revalidatePath("/owners");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Error actualizando dueño" };
  }
}
