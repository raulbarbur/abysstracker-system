"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { processSale } from "@/actions/sale-actions";
import { useToast } from "@/components/ui/Toast";
import { CartItem, PaymentMethod, SaleResult } from "@/types/pos";

export function usePosCheckout(cart: CartItem[], total: number) {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [lastSale, setLastSale] = useState<SaleResult | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;

    if (paymentMethod === "CHECKING_ACCOUNT" && !selectedCustomerId) {
      addToast("Seleccioná un cliente para fiar.", "error");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const confirmSale = async () => {
    setLoading(true);
    try {
      const payload = cart.map((item) => ({
        type: item.type,
        id: item.id,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
      }));

      const result = await processSale(
        payload,
        total,
        paymentMethod,
        selectedCustomerId || undefined,
      );

      if (result.success && result.saleId && result.date) {
        addToast("Venta Exitosa", "success");
        setLastSale({
          id: result.saleId,
          date: result.date,
          items: cart.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            price: i.price,
          })),
          total: total,
          method: paymentMethod,
        });

        setIsCheckoutModalOpen(false);
        if (searchParams.get("apptId")) {
          router.replace("/pos");
        } else {
          router.refresh();
        }
      } else {
        throw new Error(result.error || "Error al procesar la venta");
      }
    } catch (error: any) {
      addToast(error.message || "Error al procesar", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearLastSale = () => setLastSale(null);

  return {
    loading,
    paymentMethod,
    setPaymentMethod,
    lastSale,
    clearLastSale,
    selectedCustomerId,
    setSelectedCustomerId,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    handleCheckoutClick,
    confirmSale,
  };
}
