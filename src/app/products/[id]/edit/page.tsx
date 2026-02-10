import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/ProductForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const owners = await prisma.owner.findMany();
  const categories = await prisma.category.findMany();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { name: "asc" } } },
  });

  if (!product) return <div>Producto no encontrado</div>;

  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description,
    ownerId: product.ownerId,
    categoryId: product.categoryId,
    unitOfMeasure: product.unitOfMeasure,
    imageUrl: product.variants[0]?.imageUrl || "",

    variants: product.variants.map((v) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      costPrice: Number(v.costPrice),
      salePrice: Number(v.salePrice),
      stock: v.stock,
      imageUrl: v.imageUrl,
      unitOfMeasure: product.unitOfMeasure,
    })),
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/products" className="text-blue-500 mb-4 block font-bold">
        ← Cancelar y Volver
      </Link>
      <ProductForm
        owners={owners}
        categories={categories}
        initialData={initialData}
      />
    </div>
  );
}
