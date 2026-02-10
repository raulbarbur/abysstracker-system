"use client";

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Icon } from "@/components/ui/Icon";

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

interface DashboardDetailedActivityProps {
  todayAppointments: AppointmentWithPet[];
  lowStockVariants: LowStockVariantClient[];
}

export function DashboardDetailedActivity({
  todayAppointments,
  lowStockVariants,
}: DashboardDetailedActivityProps) {
  return (
    <Tabs defaultValue="agenda" className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h3 className="text-xl font-black text-foreground font-nunito">
          Actividad Detallada
        </h3>
        <TabsList>
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Icon name="calendar" className="h-4 w-4" /> Agenda Hoy
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Icon name="alert" className="h-4 w-4" /> Alertas Stock
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="agenda">
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border p-6 min-h-[300px]">
          {todayAppointments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Icon name="coffee" className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-bold">Todo tranquilo por hoy</p>
              <p className="text-xs">No hay turnos programados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-accent/50 transition group bg-background"
                >
                  <div className="bg-primary/10 text-primary font-bold text-sm px-3 py-2 rounded-xl border border-primary/10 min-w-[60px] text-center">
                    {new Date(appt.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold group-hover:text-primary transition truncate">
                      {appt.pet.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appt.pet.breed} • {appt.pet.ownerName}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border shrink-0
                                  ${appt.status === "PENDING" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : ""}
                                  ${appt.status === "CONFIRMED" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : ""}
                                  ${appt.status === "COMPLETED" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                                  ${appt.status === "BILLED" ? "bg-secondary text-muted-foreground border-border" : ""}
                              `}
                  >
                    {appt.status === "BILLED" ? "COBRADO" : appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-center">
            <Link
              href="/agenda"
              className="text-primary text-sm font-bold hover:underline"
            >
              Ir a la Agenda Completa →
            </Link>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stock">
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border p-6 min-h-[300px]">
          <div className="space-y-3">
            {lowStockVariants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-4 border border-border rounded-2xl hover:bg-destructive/5 transition bg-background"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-12 rounded-full ${v.stock === 0 ? "bg-destructive" : "bg-orange-400"}`}
                  ></div>
                  <div>
                    <p className="font-bold text-base">{v.product.name}</p>
                    <p className="text-xs text-muted-foreground">{v.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-xl ${v.stock === 0 ? "text-destructive" : "text-orange-500"}`}
                  >
                    {v.stock}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Unid.
                  </p>
                </div>
              </div>
            ))}
            {lowStockVariants.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-green-600">
                <Icon name="check" className="h-12 w-12 mb-4" />
                <p className="font-bold">Inventario Saludable</p>
                <p className="text-xs text-green-600/80">
                  No hay alertas de stock bajo.
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/inventory"
              className="text-orange-600 text-sm font-bold hover:underline"
            >
              Gestionar Inventario →
            </Link>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
