import { Prisma } from "@prisma/client";
import { translateMovementType } from "@/services/inventory-service";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type StockMovementWithVariant = Prisma.StockMovementGetPayload<{
  include: { variant: true };
}>;

interface ProductDetailHistoryProps {
  history: StockMovementWithVariant[];
}

export function ProductDetailHistory({ history }: ProductDetailHistoryProps) {
  return (
    <div className="lg:col-span-2">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2 px-2">
        <Icon name="notebook" className="w-5 h-5" />
        Auditoría de Movimientos
      </h2>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Variante</th>
                <th className="p-4">Acción</th>
                <th className="p-4 text-right">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-muted-foreground italic"
                  >
                    No hay movimientos registrados aún.
                  </td>
                </tr>
              ) : (
                history.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  const typeLabel = translateMovementType(mov.type);

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="p-4">
                        <p className="font-bold text-foreground">
                          {mov.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {mov.createdAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {mov.variant.name === "Estándar"
                          ? "-"
                          : mov.variant.name}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">
                          {typeLabel}
                        </p>
                        {mov.reason && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">
                            "{mov.reason}"
                          </p>
                        )}
                      </td>
                      <td
                        className={cn(
                          "p-4 text-right font-black text-base",
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {mov.quantity}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
