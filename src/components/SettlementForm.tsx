"use client";

import { useState, useMemo } from "react";
import { createSettlement } from "@/actions/settlement-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type SourceItem = {
  id: string;
  pendingQty: number;
  date: Date;
};

type AggregatedItem = {
  id: string;
  type: "SALE" | "ADJUSTMENT";
  date: Date;
  description: string;
  totalPendingQuantity: number;
  cost: number;
  isAdjustment?: boolean;
  unitOfMeasure?: "GRAM" | "UNIT";
  sourceItems: SourceItem[];
};

interface Props {
  ownerId: string;
  items: AggregatedItem[];
}

export default function SettlementForm({ ownerId, items }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [selections, setSelections] = useState<
    Record<string, { selected: boolean; quantity: number }>
  >(() => {
    const initial: any = {};
    items.forEach((i) => {
      const isGram = i.unitOfMeasure === "GRAM";
      initial[i.id] = {
        selected: true,
        quantity: isGram
          ? i.totalPendingQuantity / 1000
          : i.totalPendingQuantity,
      };
    });
    return initial;
  });

  const totalToPay = useMemo(() => {
    let sum = 0;
    items.forEach((item) => {
      const sel = selections[item.id];
      if (sel && sel.selected) {
        sum += sel.quantity * item.cost;
      }
    });
    return Math.round(sum * 100) / 100;
  }, [items, selections]);

  const handleQuantityChange = (
    id: string,
    valStr: string,
    item: AggregatedItem,
  ) => {
    const cleanValStr = valStr.replace(",", ".");
    let val = parseFloat(cleanValStr);

    const isGram = item.unitOfMeasure === "GRAM";
    const max = isGram
      ? item.totalPendingQuantity / 1000
      : item.totalPendingQuantity;

    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > max) val = max;

    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: val, selected: val > 0 },
    }));
  };

  const toggleSelection = (id: string) => {
    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));
  };

  const toggleAll = () => {
    const allSelected = items.every((i) => selections[i.id]?.selected);
    const newState: any = {};
    items.forEach((i) => {
      newState[i.id] = { ...selections[i.id], selected: !allSelected };
    });
    setSelections(newState);
  };

  const onPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalToPay <= 0) {
      addToast("El total a pagar debe ser mayor a cero.", "error");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSettlement = async () => {
    setLoading(true);

    try {
      const finalPayload: {
        id: string;
        type: "SALE" | "ADJUSTMENT";
        quantity?: number;
      }[] = [];

      const selectedItems = items.filter(
        (i) => selections[i.id]?.selected && selections[i.id]?.quantity > 0,
      );

      for (const aggItem of selectedItems) {
        if (aggItem.isAdjustment) {
          finalPayload.push({ id: aggItem.id, type: "ADJUSTMENT" });
          continue;
        }

        const isGram = aggItem.unitOfMeasure === "GRAM";
        let amountToSettle = selections[aggItem.id].quantity;

        if (isGram) {
          amountToSettle = Math.round(amountToSettle * 1000);
        }

        const sortedSourceItems = [...aggItem.sourceItems].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        for (const source of sortedSourceItems) {
          if (amountToSettle <= 0) break;

          const settlementForThisItem = Math.min(
            source.pendingQty,
            amountToSettle,
          );

          finalPayload.push({
            id: source.id,
            type: "SALE",
            quantity: settlementForThisItem,
          });

          amountToSettle -= settlementForThisItem;
        }
      }

      if (finalPayload.length === 0) {
        addToast("No hay ítems con cantidad válida para liquidar.", "error");
        setLoading(false);
        setIsConfirmOpen(false);
        return;
      }

      const formData = new FormData();
      formData.append("ownerId", ownerId);
      formData.append("selection", JSON.stringify(finalPayload));

      const res = await createSettlement(formData);

      if (res?.error) {
        addToast(res.error, "error");
      } else {
        addToast("Liquidación registrada con éxito.", "success");
        router.push(`/owners/balance`);
        router.refresh();
      }
    } catch (error) {
      addToast("Error inesperado procesando la liquidación.", "error");
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <form onSubmit={onPreSubmit} className="animate-in fade-in space-y-6">
        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-10 backdrop-blur-md bg-opacity-95">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2">
              Total a Pagar
            </p>
            <p
              className={cn(
                "text-5xl font-black font-nunito transition-all",
                totalToPay > 0 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              $
              {totalToPay.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {items.filter((i) => selections[i.id]?.selected).length} ítems
              seleccionados
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || totalToPay <= 0}
            className={cn(
              "px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition active:scale-95 text-white w-full md:w-auto flex items-center justify-center gap-2",
              loading || totalToPay <= 0
                ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                : "bg-green-600 hover:bg-green-700 hover:shadow-green-900/20",
            )}
          >
            {loading ? (
              "Procesando..."
            ) : (
              <>
                <Icon name="check" className="w-6 h-6" /> Confirmar Pago
              </>
            )}
          </button>
        </div>
        <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-xs">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={toggleAll}
                      checked={items.every((i) => selections[i.id]?.selected)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Producto Agrupado</th>
                  <th className="p-4 text-center">Total Pendiente</th>
                  <th className="p-4 text-center">A Pagar (Cant.)</th>
                  <th className="p-4 text-right pr-6">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((row) => {
                  const isSelected = selections[row.id]?.selected;
                  const currentQty = selections[row.id]?.quantity;
                  const subtotal = currentQty * row.cost;
                  const isAdj = row.isAdjustment;
                  const isGram = row.unitOfMeasure === "GRAM";

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition",
                        isSelected
                          ? "bg-primary/5"
                          : "hover:bg-muted/30 opacity-60 hover:opacity-100",
                      )}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(row.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-foreground flex items-center gap-2">
                          <Icon
                            name={
                              row.type === "SALE" ? "cart" : "adjustmentReturn"
                            }
                            className="w-4 h-4 text-muted-foreground"
                          />{" "}
                          {row.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAdj
                            ? row.date.toLocaleDateString()
                            : `Agrupa ${row.sourceItems.length} ventas`}
                        </p>
                      </td>
                      <td className="p-4 text-center font-mono text-muted-foreground">
                        {isAdj
                          ? "-"
                          : `${isGram ? (row.totalPendingQuantity / 1000).toFixed(3) : row.totalPendingQuantity} ${isGram ? "Kg" : "u."}`}
                      </td>
                      <td className="p-4 text-center">
                        {isAdj ? (
                          <span className="text-xs font-bold text-muted-foreground">
                            -
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step={isGram ? "0.001" : "1"}
                              min={0}
                              max={
                                isGram
                                  ? row.totalPendingQuantity / 1000
                                  : row.totalPendingQuantity
                              }
                              value={currentQty}
                              onChange={(e) =>
                                handleQuantityChange(
                                  row.id,
                                  e.target.value,
                                  row,
                                )
                              }
                              disabled={!isSelected}
                              className={cn(
                                "w-20 text-center p-1 rounded border font-bold outline-none focus:ring-2 focus:ring-primary",
                                isSelected
                                  ? "bg-background border-input text-foreground"
                                  : "bg-transparent border-transparent text-muted-foreground",
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-bold",
                                isSelected
                                  ? "text-muted-foreground"
                                  : "text-transparent",
                              )}
                            >
                              {isGram ? "Kg" : "u."}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        className={cn(
                          "p-4 pr-6 text-right font-mono font-bold text-base",
                          row.cost < 0 ? "text-green-600" : "text-foreground",
                        )}
                      >
                        $
                        {subtotal.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSettlement}
        title="Confirmar Liquidación"
        description={`¿Estás seguro de registrar el pago por un total de $${totalToPay.toLocaleString("es-AR", { minimumFractionDigits: 2 })}? Esta acción es irreversible.`}
        confirmText="Sí, Registrar Pago"
        variant="default"
      />
    </>
  );
}
