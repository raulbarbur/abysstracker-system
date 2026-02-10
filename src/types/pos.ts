import { UnitOfMeasure } from "@prisma/client";

import type { ProductGroupType, VariantType } from "./product";
import type { CustomerOption } from "./customer";

export type { ProductGroupType, CustomerOption, VariantType };

export type CartItem = {
  type: "PRODUCT" | "SERVICE";
  id: string;
  description: string;
  price: number;
  quantity: number;
  unitOfMeasure?: UnitOfMeasure;
  stockMax?: number;
};

export type PaymentMethod = "CASH" | "TRANSFER" | "CHECKING_ACCOUNT";

export type SaleResult = {
  id: string;
  date: Date;
  items: { description: string; quantity: number; price: number }[];
  total: number;
  method: PaymentMethod;
};
