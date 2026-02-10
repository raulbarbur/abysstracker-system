import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePosSearch } from "@/hooks/pos/usePosSearch";

describe("usePosSearch Hook", () => {
  const mockProducts: any[] = [
    {
      name: "Alimento Premium",
      ownerName: "Distribuidora X",
      categoryName: "Perros",
    },
    {
      name: "Shampoo Gato",
      ownerName: "Laboratorio Y",
      categoryName: "Higiene",
    },
    {
      name: "Collar Rojo",
      ownerName: "Artesanías Z",
      categoryName: "Accesorios",
    },
    {
      name: "Alimento Económico",
      ownerName: "Distribuidora X",
      categoryName: "Perros",
    },
  ];

  it('Debe generar la lista de categorías únicas y ordenadas con "ALL"', () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));
    expect(result.current.categories).toEqual([
      "ALL",
      "Accesorios",
      "Higiene",
      "Perros",
    ]);
  });

  it("Debe filtrar por texto en el nombre (case-insensitive)", () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));

    act(() => {
      result.current.setSearch("shampoo");
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe("Shampoo Gato");
  });

  it("Debe filtrar por nombre del dueño (ownerName)", () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));

    act(() => {
      result.current.setSearch("Distribuidora X");
    });

    expect(result.current.filteredProducts).toHaveLength(2);
  });

  it("Debe filtrar por nombre de categoría (categoryName)", () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));

    act(() => {
      result.current.setSearch("Accesorios");
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe("Collar Rojo");
  });

  it("Debe filtrar usando el selector de categorías", () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));

    act(() => {
      result.current.setSelectedCategory("Perros");
    });

    expect(result.current.filteredProducts).toHaveLength(2);
    expect(
      result.current.filteredProducts.every((p) => p.categoryName === "Perros"),
    ).toBe(true);
  });

  it('Debe resetear filtros al volver a "ALL"', () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));

    act(() => {
      result.current.setSelectedCategory("Higiene");
      result.current.setSelectedCategory("ALL");
    });

    expect(result.current.filteredProducts).toHaveLength(4);
  });

  it("Debe combinar búsqueda por texto y categoría", () => {
    const { result } = renderHook(() => usePosSearch(mockProducts));

    act(() => {
      result.current.setSelectedCategory("Perros");
      result.current.setSearch("Premium");
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe("Alimento Premium");
  });
});
