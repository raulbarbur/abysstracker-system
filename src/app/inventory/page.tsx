export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import StockMovementForm from "@/components/StockMovementForm";
import SearchInput from "@/components/SearchInput";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { translateMovementType } from "@/services/inventory-service";
import { StockMovementType } from "@prisma/client";
import StockExportButton from "@/components/inventory/StockExportButton";
import InventoryFilterPanel from "@/components/inventory/InventoryFilterPanel";

interface Props {
  searchParams?: Promise<{
    query?: string;
    historySearch?: string;
    page?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
  }>;
}

function getBadgeStyles(type: string) {
  switch (type) {
    case "ENTRY":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    case "SALE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
    case "ADJUSTMENT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
    case "OWNER_WITHDRAWAL":
      return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30";
    case "RETURN":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  }
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams;

  const manualQuery = params?.query || "";
  const historyQuery = params?.historySearch || "";
  const page = Number(params?.page) || 1;
  const pageSize = 20;
  const typeFilter =
    params?.type === "ALL" ? undefined : (params?.type as StockMovementType);
  const dateFrom = params?.dateFrom;
  const dateTo = params?.dateTo;
  const userFilter = params?.userId === "ALL" ? undefined : params?.userId;

  const allUsers = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: manualQuery
        ? [
            { name: { contains: manualQuery, mode: "insensitive" } },
            {
              variants: {
                some: { name: { contains: manualQuery, mode: "insensitive" } },
              },
            },
          ]
        : undefined,
    },
    include: {
      variants: true,
      owner: true,
    },
    orderBy: { name: "asc" },
    take: manualQuery ? 50 : 10,
  });

  const productOptions = products
    .flatMap((p) =>
      p.variants.map((v) => ({
        variantId: v.id,
        productName: v.name === "Estándar" ? p.name : `${p.name} - ${v.name}`,
        ownerName: p.owner.name,
        stock: v.stock,
        unitOfMeasure: p.unitOfMeasure,
      })),
    )
    .sort((a, b) => a.productName.localeCompare(b.productName));

  const whereClause: any = {};
  if (typeFilter) whereClause.type = typeFilter;
  if (userFilter) whereClause.userId = userFilter;
  if (dateFrom || dateTo) {
    const startDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : new Date(0);
    const endDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : new Date();
    whereClause.createdAt = { gte: startDate, lte: endDate };
  }
  if (historyQuery) {
    whereClause.variant = {
      OR: [
        { name: { contains: historyQuery, mode: "insensitive" } },
        { product: { name: { contains: historyQuery, mode: "insensitive" } } },
      ],
    };
  }

  const totalMovements = await prisma.stockMovement.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalMovements / pageSize);

  const movements = await prisma.stockMovement.findMany({
    where: whereClause,
    include: {
      variant: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const userIds = [...new Set(movements.map((m) => m.userId).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(
    users.map((user) => [user.id, user.name || "Usuario Anónimo"]),
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">
              Control de Stock
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Gestión de inventario y auditoría.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/products/import"
              className="text-primary hover:bg-primary/10 text-sm font-bold border border-primary/20 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Icon name="upload" className="w-4 h-4" /> Importar Excel
            </Link>
            <Link
              href="/products"
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-bold border border-border px-4 py-2 rounded-lg transition"
            >
              ← Productos
            </Link>
          </div>
        </div>
        <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border/50">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Icon name="edit" className="w-5 h-5 text-primary" /> Nuevo
            Movimiento
          </h2>
          <div className="mb-8 bg-muted/30 p-4 rounded-xl border border-border">
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
              Buscá el producto a modificar:
            </label>
            <SearchInput placeholder="Ej: Correa, Alimento..." />
          </div>
          {productOptions.length > 0 ? (
            <StockMovementForm products={productOptions} />
          ) : (
            <div className="text-center p-4 text-muted-foreground text-sm">
              {manualQuery
                ? "No se encontraron productos."
                : "Ingresá un nombre para buscar."}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Icon name="history" className="w-6 h-6 text-muted-foreground" />{" "}
            Historial de Movimientos
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-mono">
              {totalMovements} registros
            </span>
            <StockExportButton
              filters={{
                search: historyQuery,
                type: params?.type || "ALL",
                dateFrom,
                dateTo,
                userId: userFilter,
              }}
            />
          </div>
        </div>

        <InventoryFilterPanel
          users={allUsers}
          defaultValues={{
            search: historyQuery,
            type: params?.type,
            dateFrom,
            dateTo,
            userId: userFilter,
          }}
        />

        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3 text-right">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon name="search" className="w-8 h-8 opacity-20" />
                        <p>No se encontraron movimientos con estos filtros.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-foreground">
                          {new Date(m.createdAt).toLocaleDateString("es-AR")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(m.createdAt).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {m.variant.product.name}
                        </div>
                        {m.variant.name !== "Estándar" && (
                          <div className="text-xs text-muted-foreground text-primary font-medium">
                            {m.variant.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyles(m.type)}`}
                        >
                          {translateMovementType(m.type)}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${m.quantity > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                      >
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </td>
                      <td
                        className="px-4 py-3 text-muted-foreground truncate max-w-[200px]"
                        title={m.reason || ""}
                      >
                        {m.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                        {userMap.get(m.userId) || "Desconocido"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20">
              <Link
                href={{ query: { ...params, page: page > 1 ? page - 1 : 1 } }}
                className={`text-sm font-bold px-3 py-1 rounded border border-border bg-background transition ${page <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-accent"}`}
              >
                Anterior
              </Link>
              <span className="text-xs font-medium text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Link
                href={{
                  query: {
                    ...params,
                    page: page < totalPages ? page + 1 : totalPages,
                  },
                }}
                className={`text-sm font-bold px-3 py-1 rounded border border-border bg-background transition ${page >= totalPages ? "opacity-50 pointer-events-none" : "hover:bg-accent"}`}
              >
                Siguiente
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
