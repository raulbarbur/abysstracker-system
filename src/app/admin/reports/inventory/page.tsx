import { getSession } from "@/lib/auth";
import {
  getInventoryValuation,
  getDetailedInventoryBreakdown,
} from "@/actions/financial-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import PrintButton from "@/components/PrintButton";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryValuationPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const [valuationRes, breakdownRes] = await Promise.all([
    getInventoryValuation(),
    getDetailedInventoryBreakdown(),
  ]);

  if (!valuationRes.success || !valuationRes.data) {
    return (
      <div className="p-6 text-destructive font-black">
        Error en auditoría de stock.
      </div>
    );
  }

  const { data } = valuationRes;
  const breakdown = breakdownRes.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Icon name="stock" className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">
              Auditoría de Activos
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
            Estado del Inventario
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Link
            href="/admin/reports"
            className="text-sm font-bold text-muted-foreground hover:text-primary transition bg-muted px-4 py-2 rounded-xl"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 print:hidden">
        <div className="bg-card p-6 rounded-2xl shadow-sm border-l-4 border-l-orange-400">
          <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            Variedad SKUs
          </h3>
          <p className="text-2xl font-black mt-2 tracking-tighter">
            {data.totalProducts} ítems
          </p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-400">
          <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            Stock Total
          </h3>
          <p className="text-2xl font-black mt-2 tracking-tighter">
            {data.totalStock} items
          </p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border-l-4 border-l-green-400">
          <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            Inversión (Costo)
          </h3>
          <p className="text-2xl font-black mt-2 tracking-tighter">
            {formatCurrency(data.cost)}
          </p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border-l-4 border-l-indigo-400">
          <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            Valuación (PVP)
          </h3>
          <p className="text-2xl font-black mt-2 tracking-tighter">
            {formatCurrency(data.retail)}
          </p>
        </div>
      </div>

      <div className="space-y-4 print:hidden">
        <CollapsibleSection title="Stock por Dueño" defaultOpen={false}>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-muted-foreground border-b border-border bg-muted/10">
                    <th className="p-4">Propietario</th>
                    <th className="p-4 text-right">Items Activos</th>
                    <th className="p-4 text-right">Costo</th>
                    <th className="p-4 text-right">PVP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {breakdown?.byOwner.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-right font-medium">
                        {item.stock} items
                      </td>
                      <td className="p-4 text-right font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="p-4 text-right opacity-60 font-medium">
                        {formatCurrency(item.retail)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Valuación por Categoría" defaultOpen={false}>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-muted-foreground border-b border-border bg-muted/10">
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-right">Items Activos</th>
                    <th className="p-4 text-right">Costo Invertido</th>
                    <th className="p-4 text-right">Valuación PVP</th>
                    <th className="p-4 text-right">Margen %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {breakdown?.byCategory.map((item, i) => {
                    const margin =
                      item.retail > 0
                        ? Math.round(
                            ((item.retail - item.cost) / item.retail) * 100,
                          )
                        : 0;
                    return (
                      <tr
                        key={i}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4 font-bold">{item.name}</td>
                        <td className="p-4 text-right font-medium">
                          {item.stock}
                        </td>
                        <td className="p-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(item.cost)}
                        </td>
                        <td className="p-4 text-right opacity-60">
                          {formatCurrency(item.retail)}
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-black border",
                              margin > 40
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                            )}
                          >
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div
        id="pdf-report-target"
        className="hidden print:block w-[210mm] bg-white text-black p-[20mm] font-sans"
      >
        <div className="flex justify-between items-end border-b-8 border-black pb-6 mb-10">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-1 leading-none">
              AbyssTracker
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
              Auditoría General de Stock
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black">
              {new Date().toLocaleDateString("es-AR")}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-tighter">
              Valuación de Activos Corrientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-4 border-black divide-x-4 divide-y-4 divide-black mb-12">
          <div className="p-6">
            <p className="text-xs font-black uppercase mb-2">Variedad (SKUs)</p>
            <p className="text-3xl font-black">{data.totalProducts}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-black uppercase mb-2">Stock Físico</p>
            <p className="text-3xl font-black">{data.totalStock} u</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-black uppercase mb-2">Inversión Costo</p>
            <p className="text-3xl font-black">{formatCurrency(data.cost)}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-black uppercase mb-2">Valuación PVP</p>
            <p className="text-3xl font-black">{formatCurrency(data.retail)}</p>
          </div>
        </div>

        <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-4 tracking-tight">
          Existencias por Propietario
        </h2>
        <table className="w-full border-collapse mb-10">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase">
              <th className="p-3 text-left">Propietario</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-right">Inversión</th>
              <th className="p-3 text-right">Valuación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {breakdown?.byOwner.map((item, i) => (
              <tr key={i} className="text-base">
                <td className="p-3 font-bold">{item.name}</td>
                <td className="p-3 text-right">{item.stock}</td>
                <td className="p-3 text-right font-bold">
                  {formatCurrency(item.cost)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(item.retail)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-4 tracking-tight">
          Valuación por Categoría
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase text-left">
              <th className="p-3">Categoría</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-right">Inversión</th>
              <th className="p-3 text-right">Valuación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {breakdown?.byCategory.map((item, i) => (
              <tr key={i} className="text-base">
                <td className="p-3 font-bold">{item.name}</td>
                <td className="p-3 text-right font-medium">{item.stock}</td>
                <td className="p-3 text-right font-bold text-indigo-700">
                  {formatCurrency(item.cost)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(item.retail)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-20 pt-10 border-t-2 border-dashed border-gray-400 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
          AbyssTracker - Auditoría Interna
        </div>
      </div>
    </div>
  );
}
