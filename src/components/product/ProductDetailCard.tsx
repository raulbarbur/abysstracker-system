import { Prisma } from "@prisma/client";
import { Icon } from "@/components/ui/Icon";

// Usamos Prisma.ProductGetPayload para asegurar que el tipo 'product' coincide
// con el resultado de la consulta en la página principal.
type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    category: true;
    owner: true;
  };
}>;

interface ProductDetailCardProps {
  product: ProductWithDetails;
  mainImage: string | null;
  totalStock: number;
  totalSaleValue: number;
}

export function ProductDetailCard({
  product,
  mainImage,
  totalStock,
  totalSaleValue,
}: ProductDetailCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-muted rounded-2xl border border-border flex items-center justify-center overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Icon name="noImage" className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold">Sin Foto</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-foreground font-nunito">
              {product.name}
            </h1>
            {!product.isActive && (
              <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-xs font-bold border border-destructive/20 uppercase">
                ARCHIVADO
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <p className="flex items-center gap-1">
              <Icon name="stock" className="w-4 h-4" />
              <strong className="text-foreground">
                {product.category.name}
              </strong>
            </p>
            <p className="flex items-center gap-1">
              <Icon name="user" className="w-4 h-4" />
              <strong className="text-foreground">{product.owner.name}</strong>
            </p>
          </div>

          <p className="text-muted-foreground italic text-sm border-l-4 border-primary/20 pl-4 py-1">
            {product.description || "Sin descripción."}
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">
              Stock Total
            </p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
              {totalStock}{" "}
              <span className="text-sm font-bold text-blue-600/60 dark:text-blue-400/60">
                u.
              </span>
            </p>
          </div>
          <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">
              Valor Venta (Est.)
            </p>
            <p className="text-2xl font-black text-green-700 dark:text-green-300">
              ${totalSaleValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
