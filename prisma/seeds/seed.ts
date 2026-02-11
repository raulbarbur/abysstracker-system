import { PrismaClient } from "@prisma/client";

import { seedUsers } from "./01_users.seed";
import { seedOwners } from "./02_owners.seed";
import { seedCategories } from "./03_categories.seed";
import { seedProducts } from "./04_products.seed";
import { seedVariants } from "./05_variants.seed";
import { seedInventory } from "./06_inventory.seed";
import { seedCustomers } from "./07_customers.seed";
import { seedSales } from "./08_sales.seed";
import { seedFinancials } from "./09_financials.seed";
import { seedPets } from "./10_pets.seed";
import { seedAppointments } from "./11_appointments.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando base de datos...");
  const tables = [
    "GroomingNote",
    "Appointment",
    "Pet",
    "BalanceAdjustment",
    "SettlementLine",
    "SaleItem",
    "Settlement",
    "Sale",
    "StockMovement",
    "ProductVariant",
    "Product",
    "Category",
    "Customer",
    "Owner",
    "User",
  ];

  for (const table of tables) {
    await prisma.$queryRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }

  console.log("Iniciando carga de datos...");

  try {
    await seedUsers(prisma);
    console.log("01/11 - Usuarios agregados");

    await seedOwners(prisma);
    console.log("02/11 - Proveedores agregados");

    await seedCategories(prisma);
    console.log("03/11 - Categorías agregadas");

    await seedProducts(prisma);
    console.log("04/11 - Productos agregados");

    await seedVariants(prisma);
    console.log("05/11 - Variantes agregadas");

    await seedInventory(prisma);
    console.log("06/11 - Inventario inicial cargado");

    await seedCustomers(prisma);
    console.log("07/11 - Clientes agregados");

    await seedSales(prisma);
    console.log("08/11 - Ventas registradas");

    await seedFinancials(prisma);
    console.log("09/11 - Liquidaciones y ajustes procesados");

    await seedPets(prisma);
    console.log("10/11 - Mascotas agregadas");

    await seedAppointments(prisma);
    console.log("11/11 - Turnos agendados");

    console.log("Carga de datos completa.");
  } catch (error) {
    console.error("Error durante la carga de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
