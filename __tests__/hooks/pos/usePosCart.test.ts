import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { usePosCart } from "@/hooks/pos/usePosCart";
import { useToast } from "@/components/ui/Toast";
import { UnitOfMeasure } from "@prisma/client";

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe("usePosCart Hook", () => {
  describe("Total Calculation", () => {
    it("Debe tener un total de 0 con el carrito vacío", () => {
      const { result } = renderHook(() => usePosCart());
      expect(result.current.total).toBe(0);
    });

    it("Debe sumar correctamente items por UNIDAD", () => {
      const { result } = renderHook(() => usePosCart());

      act(() => {
        result.current.setCart([
          {
            id: "1",
            type: "PRODUCT",
            quantity: 2,
            price: 10,
            description: "A",
            unitOfMeasure: UnitOfMeasure.UNIT,
          }, // 20
          {
            id: "2",
            type: "PRODUCT",
            quantity: 1,
            price: 5.5,
            description: "B",
            unitOfMeasure: UnitOfMeasure.UNIT,
          }, // 5.5
        ]);
      });

      expect(result.current.total).toBe(25.5);
    });

    it("Debe calcular correctamente el precio para items por GRAMO", () => {
      const { result } = renderHook(() => usePosCart());

      act(() => {
        result.current.setCart([
          {
            id: "1",
            type: "PRODUCT",
            quantity: 250,
            price: 10000,
            description: "Queso",
            unitOfMeasure: UnitOfMeasure.GRAM,
          },
        ]);
      });

      expect(result.current.total).toBe(2500);
    });

    it("Debe redondear el total a 2 decimales", () => {
      const { result } = renderHook(() => usePosCart());

      act(() => {
        result.current.setCart([
          {
            id: "1",
            type: "PRODUCT",
            quantity: 1,
            price: 10.999,
            description: "A",
            unitOfMeasure: UnitOfMeasure.UNIT,
          },
        ]);
      });

      expect(result.current.total).toBe(11.0);
    });
  });

  describe("Cart Manipulation", () => {
    it("addToCart debe agregar un nuevo item", () => {
      const { result } = renderHook(() => usePosCart());
      const product = {
        name: "Producto A",
        unitOfMeasure: "UNIT",
        variants: [{ id: "var-1", salePrice: 150, stock: 10 }],
      };

      act(() => {
        result.current.addToCart(product as any, 1);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].description).toBe("Producto A");
      expect(result.current.cart[0].price).toBe(150);
    });

    it("addToCart debe sumar la cantidad si el item ya existe", () => {
      const { result } = renderHook(() => usePosCart());
      const product = {
        name: "Producto A",
        unitOfMeasure: "UNIT",
        variants: [{ id: "var-1", salePrice: 150, stock: 10 }],
      };

      act(() => {
        result.current.addToCart(product as any, 1);
      });
      act(() => {
        result.current.addToCart(product as any, 2);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(3);
    });

    it("addToCart debe convertir KG a Gramos", () => {
      const { result } = renderHook(() => usePosCart());
      const product = {
        name: "Queso",
        unitOfMeasure: "GRAM",
        variants: [{ id: "var-1", salePrice: 10000, stock: 50000 }],
      };

      act(() => {
        result.current.addToCart(product as any, 0.5);
      });

      expect(result.current.cart[0].quantity).toBe(500);
    });

    it("removeFromCart debe eliminar un item por su índice", () => {
      const { result } = renderHook(() => usePosCart());

      act(() => {
        result.current.setCart([
          {
            id: "1",
            type: "PRODUCT",
            quantity: 1,
            price: 10,
            description: "A",
            unitOfMeasure: UnitOfMeasure.UNIT,
          },
          {
            id: "2",
            type: "PRODUCT",
            quantity: 1,
            price: 20,
            description: "B",
            unitOfMeasure: UnitOfMeasure.UNIT,
          },
          {
            id: "3",
            type: "PRODUCT",
            quantity: 1,
            price: 30,
            description: "C",
            unitOfMeasure: UnitOfMeasure.UNIT,
          },
        ]);
      });

      act(() => {
        result.current.removeFromCart(1);
      });

      expect(result.current.cart).toHaveLength(2);
      expect(
        result.current.cart.find((item) => item.description === "B"),
      ).toBeUndefined();
      expect(result.current.total).toBe(40);
    });
  });
});
