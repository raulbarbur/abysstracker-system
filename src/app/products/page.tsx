export const dynamic = "force-dynamic";

import { getPaginatedProducts } from "@/services/product-service";
import { getAllOwners } from "@/services/owner-service";
import ProductActions from "@/components/ProductActions";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/ui/shared/PageHeader";
import { AppCard } from "@/components/ui/shared/AppCard";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { UnitOfMeasure } from "@prisma/client";
import { ProductToolbar } from "@/components/product/ProductToolbar";

interface Props {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    ownerId?: string;
    includeArchived?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params?.query || "";
  const currentPage = Number(params?.page) || 1;
  const ownerId = params?.ownerId || "";
  const includeArchived = params?.includeArchived === "true";

  const ITEMS_PER_PAGE = 15;
  const showImages = process.env.NEXT_PUBLIC_ENABLE_IMAGES === "true";

  const [data, owners] = await Promise.all([
    getPaginatedProducts({
      query,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      ownerId: ownerId || undefined,
      includeArchived,
    }),
    getAllOwners(),
  ]);

  const { products, totalPages } = data;

  let activeFiltersCount = 0;
  if (query) activeFiltersCount++;
  if (ownerId) activeFiltersCount++;
  if (includeArchived) activeFiltersCount++;

  return (
    <div className="p-4 md:p-8 max-w-[1920px] mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      <PageHeader
        title="Inventario"
        description="Gestión maestra de productos, precios y stock."
      >
        <div className="flex gap-2 w-full md:w-auto">
          <Link
            href="/products/new"
            className="flex-1 md:flex-none justify-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-primary/20"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </Link>

          <Link
            href="/inventory"
            className="flex-1 md:flex-none justify-center bg-card hover:bg-accent text-foreground border border-border px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Icon name="stock" className="w-4 h-4" />
            <span className="hidden sm:inline">Stock</span>
          </Link>

          <Link
            href="/categories"
            className="flex-1 md:flex-none justify-center bg-card hover:bg-accent text-foreground border border-border px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Icon name="list" className="w-4 h-4" />
            <span className="hidden sm:inline">Categorías</span>
          </Link>

          <Link
            href="/products/import"
            className="flex-1 md:flex-none justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-green-900/20"
          >
            <Icon name="upload" className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </Link>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6">
        <ProductToolbar
          owners={owners}
          query={query}
          ownerId={ownerId}
          includeArchived={includeArchived}
          activeFiltersCount={activeFiltersCount}
        />

        <AppCard
          noPadding
          className="min-h-[500px] flex flex-col shadow-xl border-border/40"
        >
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio Venta</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const isArchived = !p.isActive;
                  const isWeighted = p.unitOfMeasure === UnitOfMeasure.GRAM;
                  const totalStock = p.variants.reduce(
                    (sum, v) => sum + v.stock,
                    0,
                  );
                  const variantCount = p.variants.length;
                  const prices = p.variants.map((v) => Number(v.salePrice));
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const mainImage = p.variants[0]?.imageUrl;

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "group transition-colors duration-200",
                        isArchived
                          ? "bg-muted/30 opacity-60 grayscale"
                          : "hover:bg-muted/30 bg-card",
                      )}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/products/${p.id}`}
                          className="flex items-center gap-4 group-hover:translate-x-1 transition-transform"
                        >
                          <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center relative">
                            {showImages && mainImage ? (
                              <Image
                                src={mainImage}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <Icon
                                name="stock"
                                className="text-muted-foreground w-5 h-5"
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
                                {p.name}
                              </p>
                              {isArchived && (
                                <span className="text-[9px] font-bold text-destructive border border-destructive/30 px-1 rounded uppercase">
                                  Archivado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                              <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                {p.owner.name}
                              </span>
                              {variantCount > 1 && (
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  +{variantCount} var
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-xs font-bold border border-border px-2 py-1 rounded-lg">
                          {p.category.name}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        <div className="flex flex-col">
                          {variantCount > 1 && minPrice !== maxPrice ? (
                            <span className="text-sm">
                              ${minPrice} - ${maxPrice}
                            </span>
                          ) : (
                            <span className="text-base">${minPrice || 0}</span>
                          )}
                          {isWeighted && (
                            <span className="text-[10px] text-muted-foreground uppercase">
                              por kilogramo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {totalStock === 0 ? (
                          <span className="text-destructive bg-destructive/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide">
                            AGOTADO
                          </span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                "font-mono font-bold text-lg leading-none",
                                (
                                  isWeighted
                                    ? totalStock <= 3000
                                    : totalStock <= 3
                                )
                                  ? "text-orange-500"
                                  : "text-green-600 dark:text-green-400",
                              )}
                            >
                              {isWeighted
                                ? (totalStock / 1000).toLocaleString("es-AR")
                                : totalStock}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              {isWeighted ? "kg" : "unid"}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <ProductActions
                          id={p.id}
                          isActive={p.isActive}
                          stock={totalStock}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border">
            {products.map((p) => {
              const isArchived = !p.isActive;
              const isWeighted = p.unitOfMeasure === UnitOfMeasure.GRAM;
              const totalStock = p.variants.reduce(
                (sum, v) => sum + v.stock,
                0,
              );
              const prices = p.variants.map((v) => Number(v.salePrice));
              const minPrice = Math.min(...prices);
              const mainImage = p.variants[0]?.imageUrl;

              return (
                <div
                  key={p.id}
                  className={cn(
                    "p-4 flex gap-4",
                    isArchived && "opacity-60 grayscale bg-muted/20",
                  )}
                >
                  <Link href={`/products/${p.id}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center relative">
                      {showImages && mainImage ? (
                        <Image
                          src={mainImage}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <Icon
                          name="stock"
                          className="text-muted-foreground w-8 h-8"
                        />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Link href={`/products/${p.id}`}>
                          <h3 className="font-bold text-foreground leading-tight line-clamp-2">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.owner.name} • {p.category.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-lg">
                          ${minPrice}
                        </div>
                        {isWeighted && (
                          <span className="text-[10px] text-muted-foreground block uppercase">
                            x kg
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      {totalStock === 0 ? (
                        <span className="text-xs font-black text-destructive bg-destructive/10 px-2 py-1 rounded">
                          SIN STOCK
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-1 rounded bg-secondary border border-border",
                            (isWeighted
                              ? totalStock <= 3000
                              : totalStock <= 3) &&
                              "text-orange-500 border-orange-200",
                          )}
                        >
                          Stock:{" "}
                          {isWeighted
                            ? `${totalStock / 1000}kg`
                            : `${totalStock}u`}
                        </span>
                      )}
                      <ProductActions
                        id={p.id}
                        isActive={p.isActive}
                        stock={totalStock}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground p-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Icon name="search" className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-lg">No encontramos productos</p>
              <p className="text-sm opacity-60 max-w-xs">
                {activeFiltersCount > 0
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Tu inventario está vacío."}
              </p>
            </div>
          )}

          <div className="mt-auto">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </AppCard>
      </div>
    </div>
  );
}
