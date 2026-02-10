export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import PosSystem from "@/components/PosSystem";
import { Icon } from "@/components/ui/Icon";

export default async function PosPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: true,
      owner: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  const customers = await prisma.customer.findMany({
    take: 500,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  const groupedProducts = products.map((p) => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
    const mainImage = p.variants.find((v) => v.imageUrl)?.imageUrl || null;

    return {
      id: p.id,
      name: p.name,
      categoryName: p.category.name,
      ownerName: p.owner.name,
      imageUrl: mainImage,
      totalStock: totalStock,
      unitOfMeasure: p.unitOfMeasure,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        salePrice: Number(v.salePrice),
        costPrice: Number(v.costPrice),
        stock: v.stock,
        unitOfMeasure: p.unitOfMeasure,
      })),
    };
  });

  return (
    <div className="h-screen flex flex-col p-4 bg-background">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="pos" className="w-6 h-6 text-primary" /> Punto de Venta
        </h1>
        <div className="text-sm font-bold bg-card text-muted-foreground px-3 py-1 rounded border border-border shadow-sm">
          Caja Principal
        </div>
      </header>

      <PosSystem products={groupedProducts} customers={customers} />
    </div>
  );
}
