import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSettlement } from "@/actions/settlement-actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UnitOfMeasure, PaymentStatus } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    saleItem: { findMany: vi.fn(), update: vi.fn() },
    balanceAdjustment: { findMany: vi.fn(), updateMany: vi.fn() },
    settlement: { create: vi.fn() },
    settlementLine: { createMany: vi.fn() },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback) => await callback(prismaMock)),
  };
  return { prisma: prismaMock };
});

describe("Settlement Actions (Server Action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: "admin-1",
      role: "ADMIN",
    } as any);
  });

  it("Debe rechazar si el usuario no es ADMIN", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      role: "USER",
    } as any);
    const formData = new FormData();
    const result = await createSettlement(formData);
    expect(result.error).toContain("Requiere permisos de Administrador");
  });

  it("Debe rechazar si no se seleccionaron items", async () => {
    const formData = new FormData();
    formData.append("ownerId", "owner-1");
    formData.append("selection", "[]");
    const result = await createSettlement(formData);
    expect(result.error).toContain("No seleccionaste ningún ítem");
  });

  it("Debe crear una liquidación con items de VENTA y AJUSTES", async () => {
    const selection = [
      { id: "sale-item-1", type: "SALE", quantity: 2 },
      { id: "adj-1", type: "ADJUSTMENT" },
    ];
    const formData = new FormData();
    formData.append("ownerId", "owner-1");
    formData.append("selection", JSON.stringify(selection));

    vi.mocked(prisma.saleItem.findMany).mockResolvedValue([
      {
        id: "sale-item-1",
        quantity: 2,
        settledQuantity: 0,
        costAtSale: 100,
        description: "Prod A",
        sale: { paymentStatus: "PAID" },
        variant: { product: { ownerId: "owner-1", unitOfMeasure: "UNIT" } },
      },
    ] as any);
    vi.mocked(prisma.balanceAdjustment.findMany).mockResolvedValue([
      { id: "adj-1", amount: -50, isApplied: false, ownerId: "owner-1" },
    ] as any);

    vi.mocked(prisma.settlement.create).mockResolvedValue({
      id: "settlement-123",
    } as any);

    await createSettlement(formData);

    expect(prisma.settlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: 150 }),
      }),
    );
    expect(prisma.saleItem.update).toHaveBeenCalledWith({
      where: { id: "sale-item-1" },
      data: { settledQuantity: { increment: 2 } },
    });
    expect(prisma.balanceAdjustment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isApplied: true }),
      }),
    );
  });

  it("Debe calcular correctamente el costo para items por GRAMO", async () => {
    const selection = [{ id: "item-gramo", type: "SALE", quantity: 1500 }];
    const formData = new FormData();
    formData.append("ownerId", "owner-1");
    formData.append("selection", JSON.stringify(selection));

    vi.mocked(prisma.saleItem.findMany).mockResolvedValue([
      {
        id: "item-gramo",
        quantity: 5000,
        settledQuantity: 0,
        costAtSale: 10000,
        sale: { paymentStatus: "PAID" },
        variant: { product: { ownerId: "owner-1", unitOfMeasure: "GRAM" } },
      },
    ] as any);
    vi.mocked(prisma.settlement.create).mockResolvedValue({
      id: "settlement-123",
    } as any);

    await createSettlement(formData);

    expect(prisma.settlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: 15000 }),
      }),
    );
  });

  it("Debe fallar si un item de venta NO está PAGADO (PAID)", async () => {
    const selection = [{ id: "item-pending", type: "SALE", quantity: 1 }];
    const formData = new FormData();
    formData.append("ownerId", "owner-1");
    formData.append("selection", JSON.stringify(selection));

    vi.mocked(prisma.saleItem.findMany).mockResolvedValue([
      {
        id: "item-pending",
        description: "Item Deudor",
        sale: { paymentStatus: "PENDING" },
        variant: { product: { ownerId: "owner-1" } },
      },
    ] as any);

    const result = await createSettlement(formData);
    expect(result.error).toContain("porque el cliente AÚN NO PAGÓ");
  });

  it("Debe fallar si se intenta liquidar más cantidad de la pendiente", async () => {
    const selection = [{ id: "item-over", type: "SALE", quantity: 3 }];
    const formData = new FormData();
    formData.append("ownerId", "owner-1");
    formData.append("selection", JSON.stringify(selection));

    vi.mocked(prisma.saleItem.findMany).mockResolvedValue([
      {
        id: "item-over",
        quantity: 10,
        settledQuantity: 8,
        description: "Item Parcial",
        sale: { paymentStatus: "PAID" },
        variant: { product: { ownerId: "owner-1", unitOfMeasure: "UNIT" } },
      },
    ] as any);

    const result = await createSettlement(formData);
    expect(result.error).toContain("solo se deben 2");
  });

  it("Debe fallar si el total calculado es negativo o cero", async () => {
    const selection = [{ id: "adj-neg", type: "ADJUSTMENT" }];
    const formData = new FormData();
    formData.append("ownerId", "owner-1");
    formData.append("selection", JSON.stringify(selection));

    vi.mocked(prisma.balanceAdjustment.findMany).mockResolvedValue([
      { id: "adj-neg", amount: -200, isApplied: false, ownerId: "owner-1" },
    ] as any);

    const result = await createSettlement(formData);
    expect(result.error).toContain("liquidaciones negativas o en cero");
  });
});
