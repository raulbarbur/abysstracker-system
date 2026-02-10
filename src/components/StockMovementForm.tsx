"use client";

import { useState } from "react";
import { registerStockMovement } from "@/actions/inventory-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { UnitOfMeasure } from "@prisma/client";

type ProductOption = {
  variantId: string;
  productName: string;
  ownerName: string;
  stock: number;
  unitOfMeasure: UnitOfMeasure;
};

export default function StockMovementForm({
  products,
  redirectPath,
}: {
  products: ProductOption[];
  redirectPath?: string;
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "ENTRY" | "OWNER_WITHDRAWAL" | "ADJUSTMENT"
  >("ENTRY");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const router = useRouter();

  const selectedProduct = products.find(
    (p) => p.variantId === selectedVariantId,
  );
  const isWeighted = selectedProduct?.unitOfMeasure === UnitOfMeasure.GRAM;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await registerStockMovement(formData);

    if (result.success) {
      addToast("Movimiento registrado correctamente", "success");
      form.reset();
      setSelectedType("ENTRY");
      setSelectedVariantId("");
      router.refresh();

      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push("/products");
      }
    } else {
      addToast("ERROR: " + result.error, "error");
    }

    setLoading(false);
  };

  const themeColor = {
    ENTRY:
      "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
    OWNER_WITHDRAWAL:
      "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    ADJUSTMENT:
      "border-destructive bg-destructive/10 text-destructive dark:text-red-400",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 animate-in fade-in duration-300"
    >
      <div className="space-y-3">
        <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">
          1. Tipo de Acción
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label
            className={cn(
              "cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2 hover:scale-[1.02]",
              selectedType === "ENTRY"
                ? "border-green-500 bg-green-500/5 shadow-md shadow-green-500/10"
                : "border-border bg-card hover:border-green-500/50",
            )}
          >
            <input
              type="radio"
              name="type"
              value="ENTRY"
              checked={selectedType === "ENTRY"}
              onChange={() => setSelectedType("ENTRY")}
              className="sr-only"
            />
            <Icon
              name="entry"
              className={cn(
                "h-8 w-8 mb-1",
                selectedType === "ENTRY"
                  ? "text-green-600"
                  : "text-muted-foreground",
              )}
            />
            <div>
              <span
                className={cn(
                  "block font-black text-sm",
                  selectedType === "ENTRY"
                    ? "text-green-600 dark:text-green-400"
                    : "text-foreground",
                )}
              >
                INGRESO
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Nueva mercadería
              </span>
            </div>
          </label>

          <label
            className={cn(
              "cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2 hover:scale-[1.02]",
              selectedType === "OWNER_WITHDRAWAL"
                ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/10"
                : "border-border bg-card hover:border-orange-500/50",
            )}
          >
            <input
              type="radio"
              name="type"
              value="OWNER_WITHDRAWAL"
              checked={selectedType === "OWNER_WITHDRAWAL"}
              onChange={() => setSelectedType("OWNER_WITHDRAWAL")}
              className="sr-only"
            />
            <Icon
              name="withdrawal"
              className={cn(
                "h-8 w-8 mb-1",
                selectedType === "OWNER_WITHDRAWAL"
                  ? "text-orange-600"
                  : "text-muted-foreground",
              )}
            />
            <div>
              <span
                className={cn(
                  "block font-black text-sm",
                  selectedType === "OWNER_WITHDRAWAL"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-foreground",
                )}
              >
                RETIRO
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Devolución a dueño
              </span>
            </div>
          </label>

          <label
            className={cn(
              "cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2 hover:scale-[1.02]",
              selectedType === "ADJUSTMENT"
                ? "border-destructive bg-destructive/5 shadow-md shadow-destructive/10"
                : "border-border bg-card hover:border-destructive/50",
            )}
          >
            <input
              type="radio"
              name="type"
              value="ADJUSTMENT"
              checked={selectedType === "ADJUSTMENT"}
              onChange={() => setSelectedType("ADJUSTMENT")}
              className="sr-only"
            />
            <Icon
              name="adjustment"
              className={cn(
                "h-8 w-8 mb-1",
                selectedType === "ADJUSTMENT"
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            />
            <div>
              <span
                className={cn(
                  "block font-black text-sm",
                  selectedType === "ADJUSTMENT"
                    ? "text-destructive dark:text-red-400"
                    : "text-foreground",
                )}
              >
                BAJA / ROTURA
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Pérdida de stock
              </span>
            </div>
          </label>
        </div>
      </div>

      <div
        className={cn(
          "p-6 rounded-2xl border transition-colors duration-300",
          themeColor[selectedType],
        )}
      >
        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase opacity-80">
              2. Variante a Ajustar
            </label>
            <select
              name="variantId"
              required
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full p-4 rounded-xl bg-background/80 border-0 shadow-sm text-foreground font-medium focus:ring-2 focus:ring-current outline-none"
            >
              <option value="">Seleccionar variante...</option>
              {products.map((p) => (
                <option key={p.variantId} value={p.variantId}>
                  {p.productName} (Stock actual:{" "}
                  {p.unitOfMeasure === "GRAM"
                    ? `${p.stock / 1000}kg`
                    : `${p.stock}u`}
                  )
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase opacity-80">
                3. Cantidad {isWeighted ? "(en KG)" : "(en Unid.)"}
              </label>
              <div className="relative">
                <input
                  name="quantity"
                  type="number"
                  step={isWeighted ? "0.001" : "1"}
                  min="0.001"
                  required
                  className="w-full p-4 rounded-xl bg-background/80 border-0 shadow-sm text-foreground font-bold text-xl focus:ring-2 focus:ring-current outline-none"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black opacity-30">
                  {isWeighted ? "KG" : "U"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase opacity-80">
                Nota (Opcional)
              </label>
              <input
                name="reason"
                type="text"
                className="w-full p-4 rounded-xl bg-background/80 border-0 shadow-sm text-foreground focus:ring-2 focus:ring-current outline-none placeholder:text-muted-foreground/50"
                placeholder="Ej: Remito #1234"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full py-4 rounded-xl font-black text-lg shadow-lg transform transition active:scale-95 text-white flex items-center justify-center gap-2",
          selectedType === "ENTRY" && "bg-green-600 hover:bg-green-700",
          selectedType === "OWNER_WITHDRAWAL" &&
            "bg-orange-600 hover:bg-orange-700",
          selectedType === "ADJUSTMENT" && "bg-red-600 hover:bg-red-700",
          loading && "opacity-50 cursor-wait bg-muted text-muted-foreground",
        )}
      >
        {loading ? (
          <>
            <Icon name="loader" className="h-5 w-5 animate-spin" />{" "}
            Procesando...
          </>
        ) : (
          "CONFIRMAR MOVIMIENTO"
        )}
      </button>
    </form>
  );
}
