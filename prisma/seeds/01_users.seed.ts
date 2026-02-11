import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("AbyssSafe2024", 10);

  const users = [
    {
      id: "u-admin-arthur",
      email: "overseer@obsidianvoid.local",
      name: "Arthur Void",
      role: Role.ADMIN,
    },
    {
      id: "u-admin-elena",
      email: "director@obsidianvoid.local",
      name: "Elena Eclipse",
      role: Role.ADMIN,
    },
    {
      id: "u-staff-marcus",
      email: "op.shadow@obsidianvoid.local",
      name: "Marcus Shadow",
      role: Role.STAFF,
    },
    {
      id: "u-staff-valery",
      email: "op.raven@obsidianvoid.local",
      name: "Valery Raven",
      role: Role.STAFF,
    },
    {
      id: "u-staff-dante",
      email: "op.umbra@obsidianvoid.local",
      name: "Dante Umbra",
      role: Role.STAFF,
    },
    {
      id: "u-staff-selene",
      email: "op.nyx@obsidianvoid.local",
      name: "Selene Nyx",
      role: Role.STAFF,
    },
    {
      id: "u-staff-kael",
      email: "op.vortex@obsidianvoid.local",
      name: "Kael Vortex",
      role: Role.STAFF,
    },
    {
      id: "u-staff-iris",
      email: "op.cipher@obsidianvoid.local",
      name: "Iris Cipher",
      role: Role.STAFF,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: passwordHash,
      },
      create: {
        ...u,
        password: passwordHash,
      },
    });
  }

  console.log(`${users.length} usuarios agregados`);
}
