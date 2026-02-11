"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role, Prisma } from "@prisma/client";
import { hashPassword, getSession } from "@/lib/auth";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoError = {
  error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
};

export async function createUser(formData: FormData) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado." };
  if (session.role !== "ADMIN")
    return { error: "Permisos insuficientes. Se requiere Administrador." };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as Role) || "STAFF";

  if (!name || !email || !password) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: "El email ya está registrado." };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error creando usuario:", error);
    return { error: "Error interno al crear usuario" };
  }
}

export async function getUsers() {
  const session = await getSession();
  if (!session) {
    throw new Error("No autorizado.");
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return { success: true, data: users };
  } catch (error) {
    throw new Error("Error al cargar usuarios");
  }
}

export async function deleteUser(userIdToDelete: string) {
  if (isDemoMode) return demoError;

  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return {
        error:
          "No autorizado. Solo un Administrador puede realizar esta acción.",
      };
    }

    if (session.userId === userIdToDelete) {
      return {
        error:
          "No puedes eliminar tu propio usuario. Solicita a otro Administrador si es necesario.",
      };
    }

    await prisma.user.delete({ where: { id: userIdToDelete } });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "No se puede eliminar: el usuario tiene historial crítico asociado (ventas, movimientos, etc.).",
      };
    }

    console.error("Error eliminando usuario:", error);
    return { error: "Error inesperado al intentar eliminar el usuario." };
  }
}

export async function changePassword(userId: string, newPassword: string) {
  if (isDemoMode) return demoError;

  const session = await getSession();
  if (!session) return { error: "No autorizado." };

  if (session.role !== "ADMIN" && session.userId !== userId) {
    return { error: "Permisos insuficientes." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return { error: "Error interno al actualizar la contraseña." };
  }
}
