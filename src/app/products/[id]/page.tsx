export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductDetailHeader } from "@/components/product/ProductDetailHeader";
import { ProductDetailCard } from "@/components/product/ProductDetailCard";
import { ProductDetailSidebar } from "@/components/product/ProductDetailSidebar";
import { ProductDetailHistory } from "@/components/product/ProductDetailHistory";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      owner: true,
      variants: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!product) return notFound();

  const history = await prisma.stockMovement.findMany({
    where: { variant: { productId: id } },
    include: { variant: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const formOptions = product.variants.map((v) => ({
    variantId: v.id,
    productName: v.name === "Estándar" ? product.name : v.name,
    ownerName: product.owner.name,
    stock: v.stock,
    unitOfMeasure: product.unitOfMeasure,
  }));

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  let totalCostValue = 0;
  let totalSaleValue = 0;

  product.variants.forEach((v) => {
    totalCostValue += Number(v.costPrice) * v.stock;
    totalSaleValue += Number(v.salePrice) * v.stock;
  });

  const mainImage = product.variants.find((v) => v.imageUrl)?.imageUrl || null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <ProductDetailHeader productId={id} />

      <ProductDetailCard
        product={product}
        mainImage={mainImage}
        totalStock={totalStock}
        totalSaleValue={totalSaleValue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ProductDetailSidebar
          variants={product.variants}
          formOptions={formOptions}
          productId={id}
          totalCostValue={totalCostValue}
        />

        <ProductDetailHistory history={history} />
      </div>
    </div>
  );
}
