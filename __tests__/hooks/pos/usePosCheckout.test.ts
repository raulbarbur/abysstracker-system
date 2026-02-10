import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePosCheckout } from "@/hooks/pos/usePosCheckout";
import { processSale } from "@/actions/sale-actions";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams } from "next/navigation";

const mockAddToast = vi.fn();

vi.mock("@/actions/sale-actions", () => ({
  processSale: vi.fn(),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

describe("usePosCheckout Hook", () => {
  const mockCart: any[] = [
    {
      id: "1",
      type: "PRODUCT",
      description: "Prod A",
      price: 100,
      quantity: 2,
    },
  ];
  const mockTotal = 200;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleCheckoutClick", () => {
    it("No debe abrir el modal si el carrito está vacío", () => {
      const { result } = renderHook(() => usePosCheckout([], 0));
      act(() => {
        result.current.handleCheckoutClick();
      });
      expect(result.current.isCheckoutModalOpen).toBe(false);
    });

    it("Debe mostrar error si es Cuenta Corriente sin cliente seleccionado", () => {
      const { result } = renderHook(() => usePosCheckout(mockCart, mockTotal));

      act(() => {
        result.current.setPaymentMethod("CHECKING_ACCOUNT");
        result.current.setSelectedCustomerId("");
      });

      act(() => {
        result.current.handleCheckoutClick();
      });

      expect(result.current.isCheckoutModalOpen).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        "Seleccioná un cliente para fiar.",
        "error",
      );
    });

    it("Debe abrir el modal si los datos son correctos", () => {
      const { result } = renderHook(() => usePosCheckout(mockCart, mockTotal));
      act(() => {
        result.current.handleCheckoutClick();
      });
      expect(result.current.isCheckoutModalOpen).toBe(true);
    });
  });

  describe("confirmSale (Server Integration)", () => {
    it("Debe procesar la venta exitosamente y guardar el resultado", async () => {
      const { result } = renderHook(() => usePosCheckout(mockCart, mockTotal));
      const mockDate = new Date();

      vi.mocked(processSale).mockResolvedValue({
        success: true,
        saleId: "sale-123",
        date: mockDate,
      } as any);
      await act(async () => {
        await result.current.confirmSale();
      });

      expect(processSale).toHaveBeenCalled();
      expect(result.current.lastSale?.id).toBe("sale-123");
      expect(result.current.isCheckoutModalOpen).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith("Venta Exitosa", "success");
    });

    it("Debe manejar errores de la Server Action", async () => {
      const { result } = renderHook(() => usePosCheckout(mockCart, mockTotal));

      vi.mocked(processSale).mockResolvedValue({
        error: "Stock insuficiente",
      } as any);

      await act(async () => {
        await result.current.confirmSale();
      });

      expect(result.current.loading).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith("Stock insuficiente", "error");
      expect(result.current.lastSale).toBeNull();
    });

    it("Debe activar el estado de loading durante la operación", async () => {
      const { result } = renderHook(() => usePosCheckout(mockCart, mockTotal));

      let resolvePromise: any;
      const delayedPromise = new Promise((res) => {
        resolvePromise = res;
      });
      vi.mocked(processSale).mockReturnValue(delayedPromise as any);

      let callPromise: Promise<void>;
      act(() => {
        callPromise = result.current.confirmSale();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ success: true, saleId: "1", date: new Date() });
        await callPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
