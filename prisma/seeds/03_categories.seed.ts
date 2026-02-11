import { PrismaClient } from "@prisma/client";

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    { id: "cat-nutricion-profunda", name: "Nutrición Profunda" },
    { id: "cat-higiene-plasma", name: "Higiene de Plasma" },
    { id: "cat-equipo-tactico", name: "Equipo Táctico" },
    { id: "cat-salud-biometrica", name: "Salud Biométrica" },
    { id: "cat-accesorios-zenit", name: "Accesorios Zenit" },
    { id: "cat-entrenamiento-vortex", name: "Entrenamiento Vortex" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
      },
      create: c,
    });
  }

  console.log(`${categories.length} categorías agregadas`);
}
