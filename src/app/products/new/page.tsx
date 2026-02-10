import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/ProductForm";
import { PageHeader } from "@/components/ui/shared/PageHeader";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default async function NewProductPage() {
  const owners = await prisma.owner.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-4">
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground text-sm font-bold flex items-center gap-2 transition w-fit"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          Volver al Inventario
        </Link>

        <PageHeader
          title="Nuevo Producto"
          description="Completá la ficha técnica para dar de alta un nuevo ítem en el sistema."
        />
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-sm">
        <ProductForm owners={owners} categories={categories} />
      </div>
    </div>
  );
}
