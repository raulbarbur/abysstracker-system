"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGroupType } from "@/types/product";
import { usePosCart } from "./pos/usePosCart";
import { usePosCheckout } from "./pos/usePosCheckout";
import { usePosSearch } from "./pos/usePosSearch";

export function usePos(products: ProductGroupType[]) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedProductForModal, setSelectedProductForModal] =
    useState<ProductGroupType | null>(null);
  const searchState = usePosSearch(products);
  const cartState = usePosCart();
  const checkoutState = usePosCheckout(cartState.cart, cartState.total);

  const processedApptId = useRef<string | null>(null);

  useEffect(() => {
    const apptId = searchParams.get("apptId");
    const petName = searchParams.get("petName");

    if (apptId && petName && processedApptId.current !== apptId) {
      processedApptId.current = apptId;

      cartState.addServiceToCart(apptId, decodeURIComponent(petName));

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("apptId");
      newParams.delete("petName");
      router.replace(`/pos?${newParams.toString()}`, { scroll: false });
    }
  }, [searchParams, cartState, router]);

  useEffect(() => {
    if (checkoutState.lastSale) {
      cartState.setCart([]);
      checkoutState.setSelectedCustomerId("");
      checkoutState.setPaymentMethod("CASH");
      processedApptId.current = null;
    }
  }, [checkoutState.lastSale, cartState, checkoutState]);

  return {
    ...searchState,
    ...cartState,
    ...checkoutState,
    selectedProductForModal,
    setSelectedProductForModal,
  };
}
