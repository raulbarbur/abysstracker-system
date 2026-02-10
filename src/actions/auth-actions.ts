"use server";

import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  deleteSession,
  hashPassword,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import crypto from "crypto";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Completá todos los campos." };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Credenciales inválidas." };
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { error: "Credenciales inválidas." };
    }

    await createSession(user.id, user.role, user.name);
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Error intentando iniciar sesión." };
  }

  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) return { error: "Ingresa tu email." };

  if (!process.env.RESEND_API_KEY) {
    console.error(
      "CRITICAL: RESEND_API_KEY is not defined in environment variables.",
    );
    return { error: "El servicio de correo no está configurado." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        success: true,
        message: "Si el correo existe, recibirás instrucciones.",
      };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "AbyssTracker <onboarding@resend.dev>",
      to: email,
      subject: "Recuperar Contraseña - AbyssTracker",
      html: `
                <h1>Recuperación de Contraseña</h1>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                <a href="${resetUrl}" style="background-color:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;">Restablecer Contraseña</a>
                <p>Este enlace expira en 1 hora.</p>
                <p>Si no fuiste tú, ignora este correo.</p>
            `,
    });

    if (error) {
      console.error("Error de Resend:", error);
      return { error: "No se pudo enviar el correo de recuperación." };
    }

    return {
      success: true,
      message: "Correo enviado. Revisa tu bandeja de entrada.",
    };
  } catch (error) {
    console.error("Reset request error:", error);
    return { error: "Error al procesar la solicitud." };
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) return { error: "Datos inválidos." };

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return { error: "El enlace es inválido o ha expirado." };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Error al restablecer contraseña." };
  }
}
