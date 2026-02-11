import { PrismaClient } from "@prisma/client";

const GROOMING_NOTES = [
  "Protocolo de higiene profunda ejecutado. Estado optimo.",
  "Mantenimiento de pelaje tipo Espectro. Sin anomalias detectadas.",
  "Ajuste de perfilacion energetica.",
  "Aplicacion de solucion desparasitante Anti-Abismo.",
  "Rutina de acondicionamiento Nebulosa.",
  "Descontaminación estandar post-mision.",
  "Revision de circuitos pilosos.",
];

export async function seedPets(prisma: PrismaClient) {
  let totalPetsCreated = 0;
  let totalGroomingNotesCreated = 0;

  const petsToCreate = [
    {
      id: "pet-nemesis",
      name: "Nemesis",
      ownerName: "Agente Fenix",
      ownerPhone: "+34 600 000 001",
      breed: "Clasificado A-Alpha",
      notes: "Canino de exploracion tactica.",
    },
    {
      id: "pet-khaos",
      name: "Khaos",
      ownerName: "Comandante R. Atlas",
      ownerPhone: "+34 600 000 002",
      breed: "Felino Omega",
      notes: "Felino de vigilancia.",
    },
    {
      id: "pet-orion",
      name: "Orion",
      ownerName: "Dra. E. Kael",
      ownerPhone: "+34 600 000 003",
      breed: "Unidad Canina K9",
      notes: "Compañero operativo.",
    },
    {
      id: "pet-vesper",
      name: "Vesper",
      ownerName: "Tecnico L. Vega",
      ownerPhone: "+34 600 000 004",
      breed: "Cripto-Canino",
      notes: "Silencioso y agil.",
    },
    {
      id: "pet-aegis",
      name: "Aegis",
      ownerName: "Jefe de Operaciones",
      ownerPhone: "+34 600 000 005",
      breed: "Guardia Sinaptica",
      notes: "Ejemplar de apoyo.",
    },
    {
      id: "pet-zenith",
      name: "Zenith",
      ownerName: "Asistente C. Thorne",
      ownerPhone: "+34 620 0000006",
      breed: "Bio-Ingenieril",
      notes: "Primera fase de pruebas.",
    },
    {
      id: "pet-rift",
      name: "Rift",
      ownerName: "Operador Sigma",
      ownerPhone: "+34 630 0000007",
      breed: "Especie Adaptativa",
      notes: "Comportamiento impredecible.",
    },
    {
      id: "pet-comet",
      name: "Comet",
      ownerName: "Investigador P. Thorne",
      ownerPhone: "+34 600 0000008",
      breed: "Prototipo 7",
      notes: "Necesita refuerzo positivo.",
    },
    {
      id: "pet-aura",
      name: "Aura",
      ownerName: "Guardian Z. Rex",
      ownerPhone: "+34 610 0000009",
      breed: "Mascota Sintetica",
      notes: "Interaccion limitada.",
    },
    {
      id: "pet-pixel",
      name: "Pixel",
      ownerName: "Piloto K. Nova",
      ownerPhone: "+34 620 0000010",
      breed: "Unidad Canina K9",
      notes: "Detecta anomalias.",
    },
    {
      id: "pet-byte",
      name: "Byte",
      ownerName: "Agente Fenix",
      ownerPhone: "+34 600 000 001",
      breed: "Felino Omega",
      notes: "Analisis neuronal.",
    },
    {
      id: "pet-shard",
      name: "Shard",
      ownerName: "Comandante R. Atlas",
      ownerPhone: "+34 600 000 002",
      breed: "Clasificado B-Beta",
      notes: "No reacciona bien a frecuencias.",
    },
    {
      id: "pet-luna",
      name: "Luna",
      ownerName: "Tecnico L. Vega",
      ownerPhone: "+34 610 0000013",
      breed: "Especie Adaptativa",
      notes: "Comportamiento territorial.",
    },
    {
      id: "pet-rocky",
      name: "Rocky",
      ownerName: "Agente Fenix",
      ownerPhone: "+34 600 000 001",
      breed: "Clasificado A-Alpha",
      notes: "Actitud juguetona.",
    },
    {
      id: "pet-shadow",
      name: "Shadow",
      ownerName: "Operador Sigma",
      ownerPhone: "+34 630 0000015",
      breed: "Cripto-Canino",
      notes: "Se camufla en ambientes oscuros.",
    },
  ];

  for (const petData of petsToCreate) {
    const pet = await prisma.pet.upsert({
      where: { id: petData.id },
      update: petData,
      create: petData,
    });
    totalPetsCreated++;

    const noteIndex = (totalPetsCreated - 1) % GROOMING_NOTES.length;
    await prisma.groomingNote.create({
      data: {
        petId: pet.id,
        content: GROOMING_NOTES[noteIndex],
        createdAt: new Date("2025-06-15T10:00:00Z"),
      },
    });
    totalGroomingNotesCreated++;

    if (totalPetsCreated % 3 === 0) {
      const secondNoteIndex = (totalPetsCreated * 2) % GROOMING_NOTES.length;
      await prisma.groomingNote.create({
        data: {
          petId: pet.id,
          content: GROOMING_NOTES[secondNoteIndex],
          createdAt: new Date("2025-08-20T14:30:00Z"),
        },
      });
      totalGroomingNotesCreated++;
    }
  }

  console.log(
    `${totalPetsCreated} mascotas y ${totalGroomingNotesCreated} notas de peluqueria agregadas`,
  );
}
