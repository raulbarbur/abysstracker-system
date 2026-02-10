export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import OwnerForm from "@/components/OwnerForm";
import SearchInput from "@/components/SearchInput";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/shared/PageHeader";
import { AppCard } from "@/components/ui/shared/AppCard";
import ExportOwnersButton from "@/components/ExportOwnersButton";
import { Pagination } from "@/components/ui/Pagination";
import { Icon } from "@/components/ui/Icon";

interface Props {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function OwnersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params?.query || "";
  const currentPage = Number(params?.page) || 1;
  const ITEMS_PER_PAGE = 15;

  const whereCondition = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [totalItems, owners] = await Promise.all([
    prisma.owner.count({ where: whereCondition }),
    prisma.owner.findMany({
      where: whereCondition,
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader
        title="Gestión de Dueños"
        description="Base de datos de clientes y proveedores."
      >
        <ExportOwnersButton />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <OwnerForm />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SearchInput placeholder="Buscar por nombre, mail o teléfono..." />

          <div className="grid gap-3">
            {owners.map((owner) => (
              <Link key={owner.id} href={`/owners/${owner.id}`}>
                <AppCard
                  hoverEffect
                  noPadding
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {owner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-foreground truncate">
                          {owner.name}
                        </p>
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            owner.isActive
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                              : "bg-destructive",
                          )}
                          title={owner.isActive ? "Activo" : "Inactivo"}
                        ></span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs text-muted-foreground mt-0.5 truncate">
                        {owner.email && (
                          <span className="flex items-center gap-1">
                            <Icon name="mail" className="w-3 h-3" />
                            {owner.email}
                          </span>
                        )}
                        {owner.phone && (
                          <span className="flex items-center gap-1">
                            <Icon name="phone" className="w-3 h-3" />
                            {owner.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <span className="bg-secondary text-foreground px-3 py-1.5 rounded-lg text-xs font-bold border border-border">
                      Ver Perfil
                    </span>
                  </div>
                </AppCard>
              </Link>
            ))}

            {owners.length === 0 && (
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-muted/10 animate-in fade-in">
                <div className="mb-2 opacity-50 flex justify-center">
                  <Icon name="owners" className="w-10 h-10" />
                </div>
                <p className="font-medium">
                  {query
                    ? "No se encontraron dueños con ese criterio."
                    : "No hay dueños registrados aún."}
                </p>
              </div>
            )}
          </div>

          <div className="py-2">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </div>
  );
}
