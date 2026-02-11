"use client";

import { useState } from "react";
import { markSaleAsPaid } from "@/actions/customer-actions";
import { cn, formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import TicketView from "@/components/TicketView";
import { useToast } from "@/components/ui/Toast";

type SaleType = {
  id: string;
  createdAt: Date;
  total: any;
  paymentStatus: string;
  paymentMethod: string;
  items: {
    description: string;
    quantity: number;
    priceAtSale: number;
    unitOfMeasure?: string;
  }[];
};

export default function CustomerSaleRow({ sale }: { sale: SaleType }) {
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const { addToast } = useToast();

  const isPending = sale.paymentStatus === "PENDING";

  const openTicket = () => {
    setTicketData({
      id: sale.id,
      date: sale.createdAt,
      total: Number(sale.total),
      method: sale.paymentMethod,
      items: sale.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        price: Number(i.priceAtSale),
        unitOfMeasure: i.unitOfMeasure,
      })),
    });
    setShowTicket(true);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const result = await markSaleAsPaid(sale.id);

      if (result) {
        if ("success" in result && result.saleData) {
          setTicketData(result.saleData);
          setShowTicket(true);
          addToast("Pago registrado con éxito", "success");
        } else if ("error" in result) {
          addToast(result.error, "error");
        }
      }
    } catch (error) {
      console.error("Error al cobrar:", error);
      addToast("Error inesperado al procesar el pago", "error");
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <tr
        className={cn(
          "transition group border-b border-border/50",
          isPending ? "bg-red-500/5" : "hover:bg-muted/30",
        )}
      >
        <td className="p-3 md:p-4 pl-4 md:pl-6">
          <p className="font-bold text-foreground text-xs md:text-sm">
            {new Date(sale.createdAt).toLocaleDateString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            {new Date(sale.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </td>

        <td className="p-3 md:p-4 hidden sm:table-cell">
          <div className="text-xs text-foreground/80 max-w-[150px] lg:max-w-[200px] truncate font-medium">
            {sale.items.map((i) => `${i.quantity} ${i.description}`).join(", ")}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
            ID: {sale.id.slice(0, 8)}
          </p>
        </td>

        <td className="p-3 md:p-4 text-right font-mono font-black text-sm md:text-base text-foreground">
          {formatCurrency(Number(sale.total))}
        </td>

        <td className="p-3 md:p-4 text-center">
          <span
            className={cn(
              "px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase border tracking-tighter",
              isPending
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
            )}
          >
            {isPending ? "PEND" : "OK"}
          </span>
        </td>

        <td className="p-3 md:p-4 pr-4 md:pr-6 text-right">
          <div className="flex items-center justify-end gap-1.5 md:gap-2">
            {!isPending && (
              <button
                onClick={openTicket}
                className="bg-foreground text-background hover:bg-foreground/90 p-2 sm:px-3 sm:py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Ver Comprobante"
              >
                <Icon name="finance" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[10px] font-black uppercase">
                  Ticket
                </span>
              </button>
            )}

            {isPending && (
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white p-2 sm:px-3 sm:py-2 rounded-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <Icon name="loader" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon name="finance" className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline text-[10px] font-black uppercase">
                  Cobrar
                </span>
              </button>
            )}
          </div>
        </td>
      </tr>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handlePay}
        title="Cobrar Deuda"
        description={`¿Confirmás el pago de ${formatCurrency(Number(sale.total))}?`}
        confirmText="Confirmar Pago"
        variant="default"
      />

      {showTicket && ticketData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-md w-full my-auto animate-in zoom-in-95 duration-200">
            <TicketView
              saleId={ticketData.id}
              date={ticketData.date}
              items={ticketData.items}
              total={ticketData.total}
              paymentMethod={ticketData.method}
              onClose={() => setShowTicket(false)}
              mode="HISTORY"
            />
          </div>
        </div>
      )}
    </>
  );
}
