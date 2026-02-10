"use client";

import { useState } from "react";
import TicketView from "./TicketView";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type SaleData = {
  id: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: {
    description: string;
    quantity: number;
    priceAtSale: number;
    unitOfMeasure?: string;
    variant?: {
      product?: {
        unitOfMeasure: string;
      };
    };
  }[];
};

export default function ReceiptModal({ sale }: { sale: SaleData }) {
  const [isOpen, setIsOpen] = useState(false);

  const ticketItems = sale.items.map((i) => {
    const uom = i.unitOfMeasure || i.variant?.product?.unitOfMeasure || "UNIT";

    return {
      description: i.description,
      quantity: i.quantity,
      price: i.priceAtSale,
      unitOfMeasure: uom,
    };
  });

  const createdAtDate = new Date(sale.createdAt);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={cn(
          "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
          "text-xs font-bold px-3 py-1.5 rounded-lg border border-border/50",
          "flex items-center gap-2 transition active:scale-95 shadow-sm",
        )}
      >
        <Icon name="receipt" className="w-3 h-3" />
        Ver Ticket
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-transparent w-full max-w-lg max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <TicketView
              mode="HISTORY"
              saleId={sale.id}
              date={createdAtDate}
              items={ticketItems}
              total={sale.total}
              paymentMethod={sale.paymentMethod}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
