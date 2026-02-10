import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTodayRangeUTC, TIMEZONE } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardDetailedActivity } from "@/components/dashboard/DashboardDetailedActivity";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { start, end } = getTodayRangeUTC();

  const [todaySales, todayAppointments, lowStockVariants] = await Promise.all([
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        paidAt: { gte: start, lte: end },
      },
    }),
    prisma.appointment.findMany({
      where: {
        startTime: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      include: { pet: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 3 } },
      include: { product: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  const serializedLowStock = lowStockVariants.map((v) => ({
    ...v,
    costPrice: Number(v.costPrice),
    salePrice: Number(v.salePrice),
  }));

  const stats = todaySales.reduce(
    (acc, sale) => {
      const amount = Number(sale.total);
      acc.total += amount;
      if (sale.paymentMethod === "CASH") acc.cash += amount;
      else acc.digital += amount;
      return acc;
    },
    { total: 0, cash: 0, digital: 0 },
  );

  const displayDate = formatInTimeZone(
    new Date(),
    TIMEZONE,
    "EEEE, d 'de' MMMM",
    { locale: es },
  );

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground font-nunito tracking-tight flex items-center gap-3">
            Hola, Equipo{" "}
            <Icon
              name="hand"
              className="h-8 w-8 text-yellow-500 animate-pulse"
            />
          </h1>
          <p className="text-muted-foreground font-medium mt-1 capitalize">
            Resumen de hoy, {displayDate}.
          </p>
        </div>
        <Link
          href="/pos"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 transition active:scale-95 flex items-center gap-2"
        >
          <Icon name="pos" className="h-5 w-5" />
          Abrir Caja
        </Link>
      </div>

      <DashboardKPIs
        stats={stats}
        todayAppointments={todayAppointments}
        lowStockVariants={serializedLowStock}
      />

      <DashboardDetailedActivity
        todayAppointments={todayAppointments}
        lowStockVariants={serializedLowStock}
      />
    </div>
  );
}
