import {
  getMonthlyFinancialReport,
  getSalesByCategoryReport,
  getSalesByOwnerReport,
  getAnnualSalesReport,
} from "@/actions/financial-actions";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import AnnualSummaryChart from "@/components/reports/AnnualSummaryChart";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function FinancialReportsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const now = new Date();

  const yearParam = params.year ? Number(params.year) : now.getFullYear();
  const monthParam = params.month ? Number(params.month) : now.getMonth() + 1;
  const activeTab = params.tab || "annual";

  const [generalRes, categoryRes, ownerRes, annualRes] = await Promise.all([
    getMonthlyFinancialReport(yearParam, monthParam),
    getSalesByCategoryReport(yearParam, monthParam),
    getSalesByOwnerReport(yearParam, monthParam),
    getAnnualSalesReport(yearParam),
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const monthsLabels = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-5 rounded-2xl shadow-sm border border-border print:hidden">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Centro de Reportes
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Gestión financiera y operativa
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <Link
            href="/admin/reports/inventory"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-sm font-black shadow-lg shadow-indigo-500/20 w-full lg:w-fit self-end"
          >
            <Icon name="stock" className="w-4 h-4" />
            <span>Auditoría de Stock</span>
          </Link>

          <form className="flex flex-wrap gap-2 items-center justify-end">
            <input type="hidden" name="tab" value={activeTab} />
            {activeTab === "mensual" && (
              <select
                name="month"
                defaultValue={monthParam}
                className="flex-1 md:flex-none border border-input rounded-xl px-3 py-2 text-sm bg-background font-bold"
              >
                {monthsLabels.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            <select
              name="year"
              defaultValue={yearParam}
              className="flex-1 md:flex-none border border-input rounded-xl px-3 py-2 text-sm bg-background font-bold"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-black shadow-md"
            >
              Actualizar
            </button>
          </form>
        </div>
      </div>

      <div className="flex border-b border-border gap-6 overflow-x-auto no-scrollbar print:hidden">
        {[
          { id: "annual", label: "Resumen Anual" },
          { id: "mensual", label: "Cierre Operativo Mensual" },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`?tab=${tab.id}&year=${yearParam}${tab.id === "mensual" ? `&month=${monthParam}` : ""}`}
            className={cn(
              "pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="min-h-[400px] print:hidden">
        {activeTab === "annual" && annualRes.data && (
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">
                Rendimiento Mensual {yearParam}
              </h3>
              <PrintButton />
            </div>
            <div className="overflow-x-auto">
              <AnnualSummaryChart data={annualRes.data} year={yearParam} />
            </div>
          </div>
        )}

        {activeTab === "mensual" && generalRes.data && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Ingresos Brutos"
                value={formatCurrency(generalRes.data.metrics.revenue)}
                color="border-blue-500"
              />
              <MetricCard
                title="Neto Estimado"
                value={formatCurrency(generalRes.data.metrics.netIncome)}
                color="border-green-500"
                isPositive
              />
              <MetricCard
                title="Unidades Vendidas"
                value={`${generalRes.data.metrics.totalUnitsSold} items`}
                color="border-orange-500"
              />
              <MetricCard
                title="Transacciones"
                value={generalRes.data.metrics.transactionCount.toString()}
                color="border-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-black">Detalle de Operaciones</h2>
              <PrintButton />
            </div>

            <div className="space-y-4">
              <CollapsibleSection
                title="Rendimiento por Dueño"
                defaultOpen={false}
              >
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-muted-foreground border-b border-border bg-muted/10">
                          <th className="p-4">Dueño</th>
                          <th className="p-4 text-right">Unidades</th>
                          <th className="p-4 text-right">Venta Bruta</th>
                          <th className="p-4 text-right">Neto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ownerRes.data?.map((owner: any, i: number) => (
                          <tr
                            key={i}
                            className="hover:bg-muted/10 transition-colors"
                          >
                            <td className="p-4 font-bold">{owner.name}</td>
                            <td className="p-4 text-right">
                              {owner.quantity} items
                            </td>
                            <td className="p-4 text-right font-medium">
                              {formatCurrency(owner.total)}
                            </td>
                            <td className="p-4 text-right font-black text-green-600">
                              {formatCurrency(owner.total - owner.cogs)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Ventas por Categoría"
                defaultOpen={false}
              >
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-muted-foreground border-b border-border bg-muted/10">
                          <th className="p-4">Categoría</th>
                          <th className="p-4 text-right">Unidades</th>
                          <th className="p-4 text-right">Total</th>
                          <th className="p-4 text-right">Margen %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {categoryRes.data?.map((cat: any, i: number) => (
                          <tr
                            key={i}
                            className="hover:bg-muted/10 transition-colors"
                          >
                            <td className="p-4 font-bold">{cat.name}</td>
                            <td className="p-4 text-right">
                              {cat.quantity} items
                            </td>
                            <td className="p-4 text-right font-medium">
                              {formatCurrency(cat.total)}
                            </td>
                            <td className="p-4 text-right font-black text-indigo-600">
                              {cat.total > 0
                                ? Math.round(
                                    ((cat.total - cat.cogs) / cat.total) * 100,
                                  )
                                : 0}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        )}
      </div>

      <div
        id="pdf-report-target"
        className="hidden print:block w-[210mm] bg-white text-black p-[20mm] font-sans"
      >
        <div className="border-b-8 border-black pb-6 mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tighter">
              AbyssTracker
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
              Auditoría de Gestión
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black uppercase">
              {activeTab === "mensual"
                ? `${monthsLabels[monthParam - 1]} ${yearParam}`
                : `Anual ${yearParam}`}
            </p>
            <p className="text-[10px] font-black uppercase opacity-60">
              {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>

        {activeTab === "mensual" && generalRes.data && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 gap-0 border-4 border-black divide-x-4 divide-y-4 divide-black">
              <div className="p-8">
                <p className="text-xs font-black uppercase mb-2">Ingresos</p>
                <p className="text-3xl font-black">
                  {formatCurrency(generalRes.data.metrics.revenue)}
                </p>
              </div>
              <div className="p-8">
                <p className="text-xs font-black uppercase mb-2">
                  Utilidad Neta
                </p>
                <p className="text-3xl font-black">
                  {formatCurrency(generalRes.data.metrics.netIncome)}
                </p>
              </div>
              <div className="p-8">
                <p className="text-xs font-black uppercase mb-2">
                  Unidades Vendidas
                </p>
                <p className="text-3xl font-black">
                  {generalRes.data.metrics.totalUnitsSold}
                </p>
              </div>
              <div className="p-8">
                <p className="text-xs font-black uppercase mb-2">Margen %</p>
                <p className="text-3xl font-black">
                  {generalRes.data.metrics.marginPercent}%
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">
                Detalle por Dueño
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-black text-[10px] font-black uppercase text-left">
                    <th className="p-3">Dueño</th>
                    <th className="p-3 text-right">Unidades</th>
                    <th className="p-3 text-right">Venta</th>
                    <th className="p-3 text-right">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {ownerRes.data?.map((owner: any, i: number) => (
                    <tr key={i} className="text-sm">
                      <td className="p-3 font-bold">{owner.name}</td>
                      <td className="p-3 text-right">{owner.quantity}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(owner.total)}
                      </td>
                      <td className="p-3 text-right font-black">
                        {formatCurrency(owner.total - owner.cogs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">
                Ventas por Categoría
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-black text-[10px] font-black uppercase text-left">
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Unidades</th>
                    <th className="p-3 text-right">Total Venta</th>
                    <th className="p-3 text-right">Margen %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {categoryRes.data?.map((cat: any, i: number) => (
                    <tr key={i} className="text-sm">
                      <td className="p-3 font-bold">{cat.name}</td>
                      <td className="p-3 text-right">{cat.quantity}</td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(cat.total)}
                      </td>
                      <td className="p-3 text-right font-black">
                        {cat.total > 0
                          ? Math.round(
                              ((cat.total - cat.cogs) / cat.total) * 100,
                            )
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "annual" && annualRes.data && (
          <div className="space-y-10">
            <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 leading-relaxed">
              Cierre Anual {yearParam}
            </h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black text-[11px] font-black uppercase">
                  <th className="p-4 text-left">Mes</th>
                  <th className="p-4 text-right">Facturado</th>
                  <th className="p-4 text-right">Unidades</th>
                  <th className="p-4 text-right">Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {annualRes.data.map((m, i) => (
                  <tr key={i} className="text-base">
                    <td className="p-4 font-bold">{monthsLabels[i]}</td>
                    <td className="p-4 text-right font-black">
                      {formatCurrency(m.total)}
                    </td>
                    <td className="p-4 text-right">{m.units}</td>
                    <td className="p-4 text-right text-gray-500">{m.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-black text-white font-black">
                  <td className="p-4 font-black">TOTAL ANUAL</td>
                  <td className="p-4 text-right text-xl font-black">
                    {formatCurrency(
                      annualRes.data.reduce((acc, curr) => acc + curr.total, 0),
                    )}
                  </td>
                  <td className="p-4 text-right font-black">
                    {annualRes.data.reduce((acc, curr) => acc + curr.units, 0)}
                  </td>
                  <td className="p-4 text-right font-black">
                    {annualRes.data.reduce((acc, curr) => acc + curr.count, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mt-20 pt-10 border-t-2 border-gray-400 text-[9px] font-black uppercase text-center text-gray-400 tracking-[0.2em]">
          AbyssTracker - Documento Reservado de Auditoría
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, isPositive }: any) {
  return (
    <div className={`bg-card p-6 rounded-2xl shadow-sm border-l-4 ${color}`}>
      <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
        {title}
      </h3>
      <p
        className={`text-2xl font-black mt-2 tracking-tighter ${isPositive ? "text-green-600 dark:text-green-500" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
