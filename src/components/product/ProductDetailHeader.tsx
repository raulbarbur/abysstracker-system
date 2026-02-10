import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface ProductDetailHeaderProps {
  productId: string;
}

export function ProductDetailHeader({ productId }: ProductDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/products"
        className="text-primary hover:underline font-bold text-sm flex items-center gap-1"
      >
        <Icon name="chevronLeft" className="w-4 h-4" />
        Volver al Inventario
      </Link>
      <Link
        href={`/products/${productId}/edit`}
        className="bg-card hover:bg-accent text-foreground border border-border px-4 py-2 rounded-xl font-bold transition text-sm shadow-sm flex items-center gap-2"
      >
        <Icon name="edit" className="w-4 h-4" />
        Editar Datos
      </Link>
    </div>
  );
}
