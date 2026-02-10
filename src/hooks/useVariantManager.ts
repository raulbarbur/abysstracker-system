"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { VariantType } from "@/types/product";

export function useVariantManager(initialVariants?: VariantType[]) {
  const { addToast } = useToast();

  const [variants, setVariants] = useState<VariantType[]>(
    initialVariants || [
      { name: "Estándar", costPrice: 0, salePrice: 0, stock: 0 } as VariantType,
    ],
  );

  const addVariant = useCallback(() => {
    setVariants((prev) => [
      ...prev,
      { name: "", costPrice: 0, salePrice: 0, stock: 0 } as VariantType,
    ]);
  }, []);

  const removeVariant = useCallback(
    (index: number) => {
      if (variants.length <= 1) {
        addToast("Debe haber al menos una variante.", "error");
        return;
      }
      if (variants[index].id) {
        addToast("Las variantes guardadas no se borran desde aquí.", "info");
        return;
      }
      setVariants((prev) => {
        const newList = [...prev];
        newList.splice(index, 1);
        return newList;
      });
    },
    [variants, addToast],
  );

  const updateVariant = useCallback(
    (index: number, field: keyof VariantType, value: string | number) => {
      setVariants((prev) => {
        const newList = [...prev];
        newList[index] = { ...newList[index], [field]: value } as VariantType;
        return newList;
      });
    },
    [],
  );

  const validateVariants = useCallback((): boolean => {
    if (variants.some((v) => !v.name.trim())) {
      addToast("Todas las variantes deben tener un nombre.", "error");
      return false;
    }
    if (variants.some((v) => v.salePrice < v.costPrice)) {
      addToast("Revisá los precios: Hay rentabilidad negativa.", "error");
      return false;
    }
    return true;
  }, [variants, addToast]);

  return {
    variants,
    addVariant,
    removeVariant,
    updateVariant,
    validateVariants,
  };
}
