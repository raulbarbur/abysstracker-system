"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { PageHeader } from "@/components/ui/shared/PageHeader";
import { AppCard } from "@/components/ui/shared/AppCard";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { Pagination } from "@/components/ui/Pagination";
import SaleRow from "@/components/SaleRow";

import { cn, downloadBase64File } from "@/lib/utils";
import { exportSales } from "@/actions/export-actions";

type FullSale = {
  id: string;
  createdAt: string;
  paymentMethod: string;
  total: number;
  status: string;
  items: {
    description: string;
    quantity: number;
    priceAtSale: number;
    unitOfMeasure?: string;
  }[];
};

interface SalesData {
  sales: FullSale[];
  totalSalesCount: number;
  totalPeriodo?: number;
  cantVentas?: number;
  error?: string;
}
interface SalesPageProps {
  salesData: SalesData;
}

export default function SalesMinimalClient({ salesData }: SalesPageProps) {
  const [isExporting, setIsExporting] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const method = searchParams.get("method") || undefined;
  const currentPage = Number(searchParams.get("page")) || 1;

  const isFiltered = dateFrom || dateTo || method;

  const { sales, totalSalesCount, totalPeriodo, cantVentas, error } = salesData;
  const totalPages = Math.ceil(totalSalesCount / 20);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportSales(dateFrom, dateTo, method || undefined);
      if (result.success && result.base64 && result.filename) {
        downloadBase64File(result.base64, result.filename);
      } else {
        alert(`Error al exportar: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error inesperado al exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    const dateFromValue = formData.get("dateFrom") as string;
    const dateToValue = formData.get("dateTo") as string;
    const methodValue = formData.get("method") as string;

    if (dateFromValue) params.set("dateFrom", dateFromValue);
    else params.delete("dateFrom");
    if (dateToValue) params.set("dateTo", dateToValue);
    else params.delete("dateTo");
    if (methodValue) params.set("method", methodValue);
    else params.delete("method");
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-destructive">
          Error al Cargar Ventas
        </h1>
        <p className="text-muted-foreground mt-2">
          Ocurrió un problema en el servidor. Revise los logs para más detalles.
        </p>
        <pre className="mt-4 text-xs text-left bg-muted p-4 rounded-md overflow-x-auto">
          {error}
        </pre>
      </div>
    );
  }

  const activeFiltersLabel: string[] = [];
  if (dateFrom) activeFiltersLabel.push(`Desde: ${dateFrom}`);
  if (dateTo) activeFiltersLabel.push(`Hasta: ${dateTo}`);
  if (method) {
    const methodMap: Record<string, string> = {
      CASH: "Efectivo",
      TRANSFER: "Transferencia",
      CHECKING_ACCOUNT: "Fiado",
    };
    activeFiltersLabel.push(methodMap[method] || method);
  }
  const inputClass =
    "bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition shadow-sm [color-scheme:light] dark:[color-scheme:dark] w-full md:w-auto";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      <PageHeader
        title="Historial de Ventas"
        description={
          isFiltered
            ? "Auditoría de caja por período."
            : "Explorador del historial completo de ventas."
        }
      >
        {isFiltered && typeof totalPeriodo === "number" && (
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 text-right border border-primary/20 min-w-[200px]">
            <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5 opacity-80">
              Total Periodo
            </p>
            <p className="text-3xl font-black font-nunito tracking-tight">
              ${totalPeriodo.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold opacity-60">
              {cantVentas} operaciones
            </p>
          </div>
        )}
      </PageHeader>

      <FilterPanel activeFilters={activeFiltersLabel} title="Filtrar Ventas">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col md:flex-row items-end gap-4"
        >
          <div className="grid grid-cols-2 md:flex md:flex-row gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Desde
              </label>
              <input
                name="dateFrom"
                type="date"
                defaultValue={dateFrom || ""}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Hasta
              </label>
              <input
                name="dateTo"
                type="date"
                defaultValue={dateTo || ""}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Medio Pago
            </label>
            <select
              name="method"
              defaultValue={method || ""}
              className={cn(inputClass, "md:min-w-[140px]")}
            >
              <option value="">Todos</option>
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CHECKING_ACCOUNT">Fiado</option>
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="w-full md:w-auto bg-foreground hover:bg-foreground/80 text-background px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 h-[42px]"
            >
              Aplicar Filtros
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 h-[42px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exportando..." : "Exportar"}
            </button>
          </div>

          {isFiltered && (
            <Link
              href="/sales"
              className="w-full md:w-auto text-center text-xs font-bold text-destructive hover:underline py-3 px-2"
            >
              Limpiar
            </Link>
          )}
        </form>
      </FilterPanel>

      <AppCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="hidden md:table-header-group bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border">
              <tr>
                <th className="p-4 pl-6">Fecha</th>
                <th className="p-4">Método</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border block md:table-row-group">
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-muted-foreground block md:table-cell"
                  >
                    No se encontraron ventas para este filtro.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </AppCard>
    </div>
  );
}
