import { PrismaClient, ApptStatus } from "@prisma/client";

function generateStaticDate(index: number): Date {
  const baseDate = new Date("2025-07-01T09:00:00Z");
  const addHours = index * 2;
  return new Date(baseDate.getTime() + addHours * 60 * 60 * 1000);
}

export async function seedAppointments(prisma: PrismaClient) {
  const pets = await prisma.pet.findMany();
  if (pets.length < 15) return;

  let totalAppointmentsCreated = 0;

  const appointmentsToCreate = [
    {
      petId: pets[0].id,
      startTime: generateStaticDate(0),
      endTime: new Date("2025-07-01T10:00:00Z"),
      status: ApptStatus.COMPLETED,
    },
    {
      petId: pets[1].id,
      startTime: generateStaticDate(1),
      endTime: new Date("2025-07-01T13:30:00Z"),
      status: ApptStatus.PENDING,
    },
    {
      petId: pets[2].id,
      startTime: generateStaticDate(2),
      endTime: new Date("2025-07-01T11:30:00Z"),
      status: ApptStatus.CONFIRMED,
    },
    {
      petId: pets[3].id,
      startTime: generateStaticDate(3),
      endTime: new Date("2025-07-01T16:30:00Z"),
      status: ApptStatus.CANCELLED,
    },
    {
      petId: pets[4].id,
      startTime: generateStaticDate(4),
      endTime: new Date("2025-07-01T14:30:00Z"),
      status: ApptStatus.BILLED,
    },
    {
      petId: pets[5].id,
      startTime: generateStaticDate(5),
      endTime: new Date("2025-07-01T13:00:00Z"),
      status: ApptStatus.COMPLETED,
    },
    {
      petId: pets[6].id,
      startTime: generateStaticDate(6),
      endTime: new Date("2025-07-02T09:30:00Z"),
      status: ApptStatus.PENDING,
    },
    {
      petId: pets[7].id,
      startTime: generateStaticDate(7),
      endTime: new Date("2025-07-02T12:00:00Z"),
      status: ApptStatus.CONFIRMED,
    },
    {
      petId: pets[8].id,
      startTime: generateStaticDate(8),
      endTime: new Date("2025-07-02T11:00:00Z"),
      status: ApptStatus.CANCELLED,
    },
    {
      petId: pets[9].id,
      startTime: generateStaticDate(9),
      endTime: new Date("2025-07-02T15:00:00Z"),
      status: ApptStatus.BILLED,
    },
    {
      petId: pets[10].id,
      startTime: generateStaticDate(10),
      endTime: new Date("2025-07-02T13:30:00Z"),
      status: ApptStatus.COMPLETED,
    },
    {
      petId: pets[11].id,
      startTime: generateStaticDate(11),
      endTime: new Date("2025-07-03T09:00:00Z"),
      status: ApptStatus.PENDING,
    },
    {
      petId: pets[12].id,
      startTime: generateStaticDate(12),
      endTime: new Date("2025-07-03T10:00:00Z"),
      status: ApptStatus.CONFIRMED,
    },
    {
      petId: pets[13].id,
      startTime: generateStaticDate(13),
      endTime: new Date("2025-07-03T14:30:00Z"),
      status: ApptStatus.CANCELLED,
    },
    {
      petId: pets[14].id,
      startTime: generateStaticDate(14),
      endTime: new Date("2025-07-03T11:30:00Z"),
      status: ApptStatus.BILLED,
    },
    {
      petId: pets[0].id,
      startTime: generateStaticDate(15),
      endTime: new Date("2025-07-03T16:30:00Z"),
      status: ApptStatus.COMPLETED,
    },
    {
      petId: pets[1].id,
      startTime: generateStaticDate(16),
      endTime: new Date("2025-07-04T09:00:00Z"),
      status: ApptStatus.PENDING,
    },
    {
      petId: pets[2].id,
      startTime: generateStaticDate(17),
      endTime: new Date("2025-07-04T13:00:00Z"),
      status: ApptStatus.CONFIRMED,
    },
    {
      petId: pets[3].id,
      startTime: generateStaticDate(18),
      endTime: new Date("2025-07-04T10:00:00Z"),
      status: ApptStatus.CANCELLED,
    },
    {
      petId: pets[4].id,
      startTime: generateStaticDate(19),
      endTime: new Date("2025-07-04T13:30:00Z"),
      status: ApptStatus.BILLED,
    },
    {
      petId: pets[5].id,
      startTime: generateStaticDate(20),
      endTime: new Date("2025-07-04T14:00:00Z"),
      status: ApptStatus.COMPLETED,
    },
    {
      petId: pets[6].id,
      startTime: generateStaticDate(21),
      endTime: new Date("2025-07-05T11:00:00Z"),
      status: ApptStatus.PENDING,
    },
    {
      petId: pets[7].id,
      startTime: generateStaticDate(22),
      endTime: new Date("2025-07-05T16:00:00Z"),
      status: ApptStatus.CONFIRMED,
    },
    {
      petId: pets[8].id,
      startTime: generateStaticDate(23),
      endTime: new Date("2025-07-05T13:30:00Z"),
      status: ApptStatus.CANCELLED,
    },
    {
      petId: pets[9].id,
      startTime: generateStaticDate(24),
      endTime: new Date("2025-07-05T14:00:00Z"),
      status: ApptStatus.BILLED,
    },
    {
      petId: pets[10].id,
      startTime: generateStaticDate(25),
      endTime: new Date("2025-07-05T10:00:00Z"),
      status: ApptStatus.COMPLETED,
    },
    {
      petId: pets[11].id,
      startTime: generateStaticDate(26),
      endTime: new Date("2025-07-06T12:00:00Z"),
      status: ApptStatus.PENDING,
    },
    {
      petId: pets[12].id,
      startTime: generateStaticDate(27),
      endTime: new Date("2025-07-06T14:00:00Z"),
      status: ApptStatus.CONFIRMED,
    },
    {
      petId: pets[13].id,
      startTime: generateStaticDate(28),
      endTime: new Date("2025-07-06T09:30:00Z"),
      status: ApptStatus.CANCELLED,
    },
    {
      petId: pets[14].id,
      startTime: generateStaticDate(29),
      endTime: new Date("2025-07-06T15:00:00Z"),
      status: ApptStatus.BILLED,
    },
  ];

  for (const apptData of appointmentsToCreate) {
    await prisma.appointment.upsert({
      where: { id: `${apptData.petId}-${apptData.startTime.toISOString()}` },
      update: {
        petId: apptData.petId,
        startTime: apptData.startTime,
        endTime: apptData.endTime,
        status: apptData.status,
      },
      create: {
        id: `${apptData.petId}-${apptData.startTime.toISOString()}`,
        petId: apptData.petId,
        startTime: apptData.startTime,
        endTime: apptData.endTime,
        status: apptData.status,
      },
    });
    totalAppointmentsCreated++;
  }

  console.log(`${totalAppointmentsCreated} turnos agregados`);
}
