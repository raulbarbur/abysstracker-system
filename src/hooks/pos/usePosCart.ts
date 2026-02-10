"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import { CartItem } from "@/types/pos";
import { ProductGroupType } from "@/types/product";
import { UnitOfMeasure } from "@prisma/client";

export function usePosCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPromotionMode, setIsPromotionMode] = useState(false);
  const { addToast } = useToast();

  const addToCart = (product: ProductGroupType, quantity: number) => {
    const isWeighted = product.unitOfMeasure === UnitOfMeasure.GRAM;
    const quantityInBaseUnit = isWeighted
      ? Math.round(quantity * 1000)
      : quantity;

    if (quantityInBaseUnit <= 0) return;

    const representativeVariant = product.variants[0];
    if (!representativeVariant) {
      addToast(`El producto ${product.name} no tiene variantes.`, "error");
      return;
    }
    const variantId = representativeVariant.id!;

    const existingItemIndex = cart.findIndex(
      (item) => item.id === variantId && item.type === "PRODUCT",
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantityInBaseUnit;
      setCart(updatedCart);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: variantId,
          type: "PRODUCT",
          description: product.name,
          price: representativeVariant.salePrice,
          quantity: quantityInBaseUnit,
          unitOfMeasure: product.unitOfMeasure,
          stockMax: representativeVariant.stock,
        },
      ]);
    }
    addToast(`${product.name} agregado.`, "success");
  };

  const addVariantToCart = (productName: string, variant: any) => {
    const variantId = variant.id!;
    const isWeighted = variant.unitOfMeasure === UnitOfMeasure.GRAM;
    const defaultQuantity = isWeighted ? 1000 : 1;
    const description = `${productName} (${variant.name})`;

    const existingItemIndex = cart.findIndex(
      (item) => item.id === variantId && item.type === "PRODUCT",
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += defaultQuantity;
      setCart(updatedCart);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: variantId,
          type: "PRODUCT",
          description: description,
          price: Number(variant.salePrice),
          quantity: defaultQuantity,
          unitOfMeasure: variant.unitOfMeasure || UnitOfMeasure.UNIT,
          stockMax: variant.stock,
        },
      ]);
    }
    addToast(`${description} agregado.`, "success");
  };

  const addServiceToCart = (apptId: string, petName: string) => {
    if (cart.some((item) => item.id === apptId)) return;
    setCart((prev) => [
      ...prev,
      {
        id: apptId,
        type: "SERVICE",
        description: `Servicio: ${petName}`,
        price: 0,
        quantity: 1,
        unitOfMeasure: "UNIT" as any,
        stockMax: 999,
      },
    ]);
  };

  const updateCartItem = (
    index: number,
    updates: Partial<Pick<CartItem, "quantity" | "price">>,
  ) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], ...updates };
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const total = useMemo(() => {
    const calculatedTotal = cart.reduce((acc, item) => {
      let itemTotal = 0;
      if (item.unitOfMeasure === UnitOfMeasure.GRAM) {
        const pricePerGram = item.price / 1000;
        itemTotal = item.quantity * pricePerGram;
      } else {
        itemTotal = item.quantity * item.price;
      }
      return acc + itemTotal;
    }, 0);
    return Math.round(calculatedTotal * 100) / 100;
  }, [cart]);

  return {
    cart,
    setCart,
    addToCart,
    addVariantToCart,
    addServiceToCart,
    updateCartItem,
    removeFromCart,
    total,
    isPromotionMode,
    setIsPromotionMode,
  };
}
