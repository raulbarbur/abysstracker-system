"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

export async function createNote(formData: FormData) {
  if (isDemoMode) return demoError;

  const petId = formData.get("petId") as string;
  const content = formData.get("content") as string;

  if (!petId || !content) return;

  try {
    await prisma.groomingNote.create({
      data: {
        petId,
        content,
      },
    });

    revalidatePath(`/pets/${petId}`);
    return { success: true };
  } catch (error) {
    console.error("Error creando nota:", error);
    return { error: "Error al guardar la nota" };
  }
}

export async function deleteNote(formData: FormData) {
  if (isDemoMode) return;

  const id = formData.get("id") as string;
  const petId = formData.get("petId") as string;

  try {
    await prisma.groomingNote.delete({ where: { id } });
    revalidatePath(`/pets/${petId}`);
  } catch (e) {
    console.error(e);
  }
}
