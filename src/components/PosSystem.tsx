"use client";

import { useState } from "react";
import { PosProvider, usePosContext } from "@/context/PosContext";
import { ProductGroupType, CustomerOption } from "@/types/pos";
import { cn } from "@/lib/utils";

import TicketView from "./TicketView";
import { VariantSelectionModal } from "./VariantSelectionModal";
import { CustomerCreationModal } from "./CustomerCreationModal";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PosHeader } from "./pos/PosHeader";
import { PosCatalog } from "./pos/PosCatalog";
import { PosTicket } from "./pos/PosTicket";

function PosSystemContent({ customers }: { customers: CustomerOption[] }) {
  const {
    lastSale,
    clearLastSale,
    cart,
    total,
    paymentMethod,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    confirmSale,
    setSelectedCustomerId,
  } = usePosContext();

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "cart">("catalog");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const paymentMethodLabel =
    {
      CASH: "Efectivo",
      TRANSFER: "Transferencia",
      CHECKING_ACCOUNT: "Cuenta Corriente",
    }[paymentMethod] || paymentMethod;

  if (lastSale) {
    if (lastSale.method === "CHECKING_ACCOUNT") {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-card p-12 rounded-3xl shadow-2xl border border-border text-center max-w-lg w-full flex flex-col items-center">
            <Icon name="notebook" className="h-24 w-24 text-purple-500 mb-8" />
            <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">
              Cuenta Actualizada
            </h2>
            <p className="text-muted-foreground text-lg font-medium mb-8">
              Se registraron los ítems correctamente.
            </p>
            <button
              onClick={clearLastSale}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-black py-5 rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-3"
            >
              <Icon name="sparkles" className="h-6 w-6" /> NUEVA VENTA
            </button>
          </div>
        </div>
      );
    }
    return (
      <TicketView
        mode="POS"
        saleId={lastSale.id}
        date={lastSale.date}
        items={lastSale.items}
        total={lastSale.total}
        paymentMethod={lastSale.method}
        onClose={clearLastSale}
      />
    );
  }

  return (
    <>
      <div className="md:hidden flex p-1 mx-4 mt-2 bg-muted/50 rounded-xl mb-4">
        <button
          onClick={() => setActiveTab("catalog")}
          className={cn(
            "flex-1 py-3 text-sm font-black rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === "catalog"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon name="stock" className="h-5 w-5" /> CATÁLOGO
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={cn(
            "flex-1 py-3 text-sm font-black rounded-lg transition-all relative flex items-center justify-center gap-2",
            activeTab === "cart"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon name="cart" className="h-5 w-5" /> CARRITO{" "}
          {cart.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] md:h-[calc(100vh-20px)] gap-6 pb-4 md:pb-0 px-4 md:px-0">
        <div
          className={cn(
            "flex-1 flex-col gap-6 overflow-hidden h-full",
            activeTab === "catalog" ? "flex" : "hidden md:flex",
          )}
        >
          <PosHeader viewMode={viewMode} setViewMode={setViewMode} />
          <PosCatalog viewMode={viewMode} />
        </div>

        <div
          className={cn(
            "w-full md:w-[420px] shrink-0 h-full flex-col",
            activeTab === "cart" ? "flex" : "hidden md:flex",
          )}
        >
          <PosTicket
            customers={customers}
            onNewCustomerClick={() => setIsCustomerModalOpen(true)}
          />
        </div>
      </div>

      <VariantSelectionModal />
      <CustomerCreationModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={setSelectedCustomerId}
      />
      <ConfirmModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={confirmSale}
        title="¿Confirmar Venta?"
        description={`Monto: $${total.toLocaleString()} | Pago: ${paymentMethodLabel.toUpperCase()}`}
        confirmText="SÍ, COBRAR"
        cancelText="CANCELAR"
        variant="default"
      />
    </>
  );
}

export default function PosSystem({
  products,
  customers,
}: {
  products: ProductGroupType[];
  customers: CustomerOption[];
}) {
  return (
    <PosProvider products={products}>
      <PosSystemContent customers={customers} />
    </PosProvider>
  );
}
