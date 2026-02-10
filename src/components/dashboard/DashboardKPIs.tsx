import { Prisma } from "@prisma/client";

type Stats = {
  total: number;
  cash: number;
  digital: number;
};

type AppointmentWithPet = Prisma.AppointmentGetPayload<{
  include: { pet: true };
}>;

type LowStockVariantClient = {
  id: string;
  name: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    categoryId: string;
    isActive: boolean;
  };
  imageUrl: string | null;
  productId: string;
};

interface DashboardKPIsProps {
  stats: Stats;
  todayAppointments: AppointmentWithPet[];
  lowStockVariants: LowStockVariantClient[];
}

export function DashboardKPIs({
  stats,
  todayAppointments,
  lowStockVariants,
}: DashboardKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-slate-900 dark:bg-card dark:border dark:border-border text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
          Caja Diaria
        </p>
        <p className="text-5xl font-black font-nunito">
          ${stats.total.toLocaleString()}
        </p>
        <div className="mt-6 flex gap-6">
          <div>
            <span className="block text-green-400 font-bold text-lg">
              ${stats.cash.toLocaleString()}
            </span>
            <span className="text-slate-500 text-xs font-bold uppercase">
              Efectivo
            </span>
          </div>
          <div className="w-px bg-slate-700"></div>
          <div>
            <span className="block text-blue-400 font-bold text-lg">
              ${stats.digital.toLocaleString()}
            </span>
            <span className="text-slate-500 text-xs font-bold uppercase">
              Digital
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition">
        <div>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mb-2">
            Turnos Hoy
          </p>
          <p className="text-4xl font-black font-nunito">
            {todayAppointments.length}
          </p>
        </div>
        <div className="mt-4">
          <div className="flex -space-x-2 overflow-hidden">
            {todayAppointments.slice(0, 4).map((appt) => (
              <div
                key={appt.id}
                className="inline-flex h-10 w-10 rounded-full ring-2 ring-background bg-primary/20 items-center justify-center text-primary font-bold text-xs"
                title={appt.pet.name}
              >
                {appt.pet.name.slice(0, 2)}
              </div>
            ))}
            {todayAppointments.length > 4 && (
              <div className="inline-flex h-10 w-10 rounded-full ring-2 ring-background bg-secondary items-center justify-center text-xs font-bold text-muted-foreground">
                +{todayAppointments.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-orange-500/10 dark:bg-orange-500/5 p-8 rounded-3xl border border-orange-500/20 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <p className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">
              Atención Requerida
            </p>
            <span className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-lg">
              Stock
            </span>
          </div>
          <p className="text-4xl font-black text-orange-700 dark:text-orange-400 font-nunito">
            {lowStockVariants.length}
          </p>
          <p className="text-orange-600/80 dark:text-orange-400/80 text-sm font-medium mt-1">
            Productos por agotarse
          </p>
        </div>
      </div>
    </div>
  );
}