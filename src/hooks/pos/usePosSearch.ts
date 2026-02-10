"use client";

import { useMemo, useState } from "react";
import { ProductGroupType } from "@/types/product";

export function usePosSearch(products: ProductGroupType[]) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">(
    "ALL",
  );

  const categories = useMemo(() => {
    const cats = products.map((p) => p.categoryName);
    return ["ALL", ...Array.from(new Set(cats))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" || p.categoryName === selectedCategory;
      const matchesText =
        p.name.toLowerCase().includes(term) ||
        p.ownerName.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term);
      return matchesCategory && matchesText;
    });
  }, [products, search, selectedCategory]);

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
  };
}
