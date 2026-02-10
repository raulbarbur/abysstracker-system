"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePos } from "@/hooks/usePos";
import { ProductGroupType } from "@/types/pos";
import { CustomerOption } from "@/types/customer";

type PosContextType = ReturnType<typeof usePos> | null;

const PosContext = createContext<PosContextType>(null);

export function usePosContext() {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error("usePosContext debe ser usado dentro de un PosProvider");
  }
  return context;
}

interface PosProviderProps {
  children: ReactNode;
  products: ProductGroupType[];
}

export function PosProvider({ children, products }: PosProviderProps) {
  const value = usePos(products);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}
