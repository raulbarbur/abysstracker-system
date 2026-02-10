import { UnitOfMeasure } from "@prisma/client";

export type VariantType = {
  id?: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  unitOfMeasure: UnitOfMeasure;
};

export type ProductGroupType = {
  id: string;
  name: string;
  categoryName: string;
  ownerName: string;
  imageUrl: string | null;
  totalStock: number;
  unitOfMeasure: UnitOfMeasure;
  variants: VariantType[];
};
