"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ProductGroupType } from "@/types/product";
import { UnitOfMeasure } from "@prisma/client";
import { usePosContext } from "@/context/PosContext";
import { WeightInputModal } from "./WeightInputModal";

interface PosProductCardProps {
  product: ProductGroupType;
  isListView: boolean;
  showImages: boolean;
}

export function PosProductCard({
  product,
  isListView,
  showImages,
}: PosProductCardProps) {
  const { addToCart } = usePosContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOOS = product.totalStock === 0;
  const isLowStock =
    product.unitOfMeasure === "GRAM"
      ? product.totalStock < 3000
      : product.totalStock <= 3;

  const stockColor = isOOS
    ? "bg-zinc-500"
    : isLowStock
      ? "bg-orange-500"
      : "bg-green-500";

  const representativeVariant = product.variants[0];
  if (!representativeVariant) return null;
  const displayPrice = representativeVariant.salePrice ?? 0;

  const handleClick = () => {
    if (isOOS) return;
    if (product.unitOfMeasure === UnitOfMeasure.GRAM) {
      setIsModalOpen(true);
    } else {
      addToCart(product, 1);
    }
  };

  const handleConfirmWeight = (weightInKg: number) => {
    if (weightInKg > 0) {
      addToCart(product, weightInKg);
    }
    setIsModalOpen(false);
  };

  const displayStock =
    product.unitOfMeasure === "GRAM"
      ? `${(product.totalStock / 1000).toLocaleString("es-AR")}kg`
      : `${product.totalStock}u`;

  if (isListView) {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isOOS}
          className={cn(
            "group flex items-center gap-6 p-4 rounded-xl border transition-all duration-200 text-left w-full h-full",
            isOOS
              ? "bg-muted border-border opacity-60 grayscale cursor-not-allowed"
              : "bg-card border-border hover:border-primary hover:shadow-md hover:translate-x-1",
          )}
        >
          {showImages && (
            <div className="h-20 w-20 rounded-lg bg-muted shrink-0 overflow-hidden relative">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                  <Icon name="noImage" className="h-6 w-6" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-foreground text-base mb-1 truncate group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[10px] font-black px-2 py-1 rounded text-white",
                  stockColor,
                )}
              >
                {displayStock}
              </span>
              <span className="text-xs text-muted-foreground font-bold uppercase truncate">
                {product.ownerName}
              </span>
            </div>
          </div>
          <div className="text-right pl-3">
            <span className="text-primary font-black text-2xl whitespace-nowrap">
              {formatCurrency(displayPrice)}
            </span>
            {product.unitOfMeasure === "GRAM" && (
              <span className="text-xs text-muted-foreground block">/kg</span>
            )}
          </div>
        </button>
        {isModalOpen && (
          <WeightInputModal
            productName={product.name}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmWeight}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isOOS}
        className={cn(
          "group flex flex-col p-4 rounded-2xl border transition-all duration-200 text-left overflow-hidden w-full h-full",
          isOOS
            ? "bg-muted border-border opacity-50 grayscale cursor-not-allowed"
            : "bg-card border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        )}
      >
        {showImages && (
          <div className="w-full aspect-square bg-muted rounded-xl overflow-hidden relative mb-4 shrink-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="25vw"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary">
                <Icon name="noImage" className="h-10 w-10 mb-1 opacity-50" />
              </div>
            )}
            <div
              className={cn(
                "absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-black text-white shadow-md z-10",
                stockColor,
              )}
            >
              {displayStock}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden space-y-1.5">
            <h3 className="font-black text-foreground text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              {!showImages && (
                <span
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded text-white shrink-0",
                    stockColor,
                  )}
                >
                  {displayStock}
                </span>
              )}
              <p className="text-xs font-bold text-muted-foreground uppercase truncate">
                {product.ownerName}
              </p>
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-dashed border-border flex justify-between items-center w-full shrink-0">
            <span className="text-primary font-black text-2xl tracking-tighter">
              {formatCurrency(displayPrice)}
            </span>
            {product.unitOfMeasure === "GRAM" && (
              <span className="text-xs text-muted-foreground">/kg</span>
            )}
          </div>
        </div>
      </button>
      {isModalOpen && (
        <WeightInputModal
          productName={product.name}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmWeight}
        />
      )}
    </>
  );
}
