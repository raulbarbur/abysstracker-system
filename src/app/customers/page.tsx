import { getPaginatedCustomers } from "@/services/customer-service";
import CustomerForm from "@/components/CustomerForm";
import SearchInput from "@/components/SearchInput";
import Link from "next/link";
import { PageHeader } from "@/components/ui/shared/PageHeader";
import { AppCard } from "@/components/ui/shared/AppCard";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import ExportCustomersButton from "@/components/ExportCustomersButton";
import { Icon } from "@/components/ui/Icon";
import { DeleteCustomerButton } from "@/components/customers/DeleteCustomerButton";

interface Props {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    filter?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params?.query || "";
  const filter = params?.filter || "";
  const currentPage = Number(params?.page) || 1;
  const ITEMS_PER_PAGE = 15;

  const { customers, totalPages } = await getPaginatedCustomers({
    query,
    filter,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      <PageHeader
        title="Cartera de Clientes"
        description="Gestión de cuentas corrientes y perfiles de contacto."
      >
        <ExportCustomersButton />
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-1 order-2 xl:order-1">
          <CustomerForm />
        </div>

        <div className="xl:col-span-2 space-y-4 md:space-y-6 order-1 xl:order-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput placeholder="Buscar cliente..." />
            </div>

            <div className="flex bg-card border border-border rounded-xl p-1 shrink-0 h-[46px]">
              <Link
                href="/customers"
                className={cn(
                  "px-4 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                  !filter
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                Activos
              </Link>
              <Link
                href="/customers?filter=debt"
                className={cn(
                  "px-4 flex items-center gap-2 justify-center rounded-lg text-xs font-bold transition-all",
                  filter === "debt"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-red-500",
                )}
              >
                <Icon name="alert" className="w-3 h-3" />
                Deudores
              </Link>
              <Link
                href="/customers?filter=archived"
                className={cn(
                  "px-4 flex items-center gap-2 justify-center rounded-lg text-xs font-bold transition-all",
                  filter === "archived"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-orange-500",
                )}
              >
                <Icon name="close" className="w-3 h-3" />
                Bajas
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <AppCard
                  hoverEffect
                  noPadding
                  className={cn(
                    "p-4 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-2xl",
                    !customer.isActive &&
                      "opacity-60 grayscale-[0.5] border-dashed",
                  )}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lg text-foreground truncate">
                        {customer.name} {!customer.isActive && "(ARCHIVADO)"}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground font-medium truncate">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Icon name="phone" className="h-3 w-3" />{" "}
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    {customer.currentDebt > 0 ? (
                      <div className="text-right">
                        <p className="text-[9px] font-black text-destructive uppercase tracking-wide">
                          Deuda
                        </p>
                        <p className="text-xl font-black text-destructive">
                          ${customer.currentDebt.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs font-black text-green-600 bg-green-500/10 px-3 py-1 rounded-lg">
                        AL DÍA
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <DeleteCustomerButton
                        id={customer.id}
                        name={customer.name}
                        saleCount={customer._count.sales}
                        isActive={customer.isActive}
                      />
                      <Icon
                        name="chevronRight"
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </div>
                  </div>
                </AppCard>
              </Link>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
