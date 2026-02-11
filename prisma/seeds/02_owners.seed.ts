import { PrismaClient } from "@prisma/client";

export async function seedOwners(prisma: PrismaClient) {
  const owners = [
    {
      id: "own-void-nutrition",
      name: "Suministros Nutricionales Void",
      email: "logistica@voidnutrition.local",
      phone: "+34 900 111 001",
      isActive: true,
      createdAt: new Date("2023-01-10T09:00:00Z"),
    },
    {
      id: "own-nebula-care",
      name: "Nebulosa Estética y Cuidado",
      email: "soporte@nebulacare.local",
      phone: "+34 900 111 002",
      isActive: true,
      createdAt: new Date("2023-02-15T10:30:00Z"),
    },
    {
      id: "own-singularity-labs",
      name: "Laboratorios Singularity",
      email: "contacto@singularity.local",
      phone: "+34 900 111 003",
      isActive: true,
      createdAt: new Date("2023-03-20T11:45:00Z"),
    },
    {
      id: "own-dark-horizon",
      name: "Accesorios Horizonte Oscuro",
      email: "ventas@darkhorizon.local",
      phone: "+34 900 111 004",
      isActive: true,
      createdAt: new Date("2023-04-25T13:00:00Z"),
    },
    {
      id: "own-alpha-core",
      name: "Núcleo Alfa Logística",
      email: "distribucion@alphacore.local",
      phone: "+34 900 111 005",
      isActive: true,
      createdAt: new Date("2023-05-30T14:15:00Z"),
    },
    {
      id: "own-vortex-tech",
      name: "Tecnología Vortex Pet",
      email: "info@vortextech.local",
      phone: "+34 900 111 006",
      isActive: false,
      createdAt: new Date("2023-06-01T15:30:00Z"),
    },
  ];

  for (const o of owners) {
    await prisma.owner.upsert({
      where: { id: o.id },
      update: {
        name: o.name,
        email: o.email,
        phone: o.phone,
        isActive: o.isActive,
        createdAt: o.createdAt,
      },
      create: o,
    });
  }

  console.log(`${owners.length} proveedores agregados`);
}
