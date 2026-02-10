import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import CustomerForm from "@/components/CustomerForm";
import CustomerSaleRow from "@/components/CustomerSaleRow";
import { InfoCard } from "@/components/ui/InfoCard";
import { Icon } from "@/components/ui/Icon";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      },
    },
  });

  if (!customer) return notFound();

  const serializedCustomer = {
    ...customer,
    sales: customer.sales.map((sale) => ({
      ...sale,
      total: Number(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        priceAtSale: Number(item.priceAtSale),
        costAtSale: Number(item.costAtSale),
      })),
    })),
  };

  const totalDebt = serializedCustomer.sales
    .filter((s) => s.paymentStatus === "PENDING")
    .reduce((sum, s) => sum + s.total, 0);

  const lifetimeValue = serializedCustomer.sales.reduce(
    (sum, s) => sum + s.total,
    0,
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className={cn(!customer.isActive && "opacity-50")}>
            <Link
              href="/customers"
              className="text-xs font-bold text-primary hover:underline mb-2 block"
            >
              ← Volver al listado
            </Link>
            <h1 className="text-3xl font-black text-foreground font-nunito">
              {customer.name} {!customer.isActive && "(ARCHIVADO)"}
            </h1>
          </div>

          <div
            className={cn(
              "px-4 py-2 rounded-xl border flex flex-col items-end",
              totalDebt > 0
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
            )}
          >
            <p className="text-[10px] font-bold uppercase opacity-80">Saldo</p>
            <p className="text-xl font-black tracking-tight">
              ${totalDebt.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <InfoCard iconName="phone" label="Teléfono" value={customer.phone} />
          <InfoCard iconName="mail" label="Email" value={customer.email} />
          <div className="ml-auto bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 text-right">
            <p className="text-[10px] font-bold text-blue-600 uppercase">
              LTV (Histórico)
            </p>
            <p className="text-lg font-black text-blue-700">
              ${lifetimeValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CustomerForm initialData={serializedCustomer} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Icon name="notebook" className="w-5 h-5" />
            Historial de Movimientos
          </h2>

          <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm min-w-[500px] md:min-w-full">
                <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4 pl-6">Fecha</th>
                    <th className="p-4 hidden sm:table-cell">Detalle</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right pr-6">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {serializedCustomer.sales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-10 text-center text-muted-foreground italic"
                      >
                        Sin movimientos registrados.
                      </td>
                    </tr>
                  ) : (
                    serializedCustomer.sales.map((sale) => (
                      <CustomerSaleRow key={sale.id} sale={sale} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
