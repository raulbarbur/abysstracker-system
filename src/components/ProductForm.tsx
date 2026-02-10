"use client";

import { useState, useRef } from "react";
import { createProduct, updateProduct } from "@/actions/product-actions";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Icon } from "@/components/ui/Icon";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useVariantManager } from "@/hooks/useVariantManager";
import { VariantType } from "@/types/product";
import { UnitOfMeasure } from "@prisma/client";

const ImageUpload = dynamic(() => import("./ImageUpload"), {
  loading: () => (
    <p className="text-xs text-muted-foreground animate-pulse">
      Cargando módulo de imágenes...
    </p>
  ),
  ssr: false,
});

type Props = {
  owners: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    categoryId: string;
    imageUrl: string | null;
    unitOfMeasure: UnitOfMeasure;
    variants: VariantType[];
  };
};

export default function ProductForm({
  owners,
  categories,
  initialData,
}: Props) {
  const router = useRouter();
  const { addToast } = useToast();

  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>(
    initialData?.unitOfMeasure || UnitOfMeasure.UNIT,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    variants,
    addVariant,
    removeVariant,
    updateVariant,
    validateVariants,
  } = useVariantManager(initialData?.variants);

  const showImages = process.env.NEXT_PUBLIC_ENABLE_IMAGES === "true";

  const handlePreValidate = () => {
    if (!validateVariants()) return;
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    if (imageUrl) formData.append("imageUrl", imageUrl);
    if (isNewCategory) formData.append("isNewCategory", "true");
    formData.append("unitOfMeasure", unitOfMeasure);
    formData.append("variantsJson", JSON.stringify(variants));

    try {
      let result;
      if (initialData) {
        formData.append("id", initialData.id);
        result = await updateProduct(formData);
        if (result && "error" in result) throw new Error(result.error);
        addToast("Producto actualizado con éxito.", "success");
        router.push("/products");
        router.refresh();
      } else {
        result = await createProduct(formData);
        if (result && "error" in result) throw new Error(result.error);
        addToast("Producto creado con éxito.", "success");
        router.push("/products");
        router.refresh();
      }
      setShowConfirm(false);
    } catch (error: any) {
      addToast(error.message, "error");
    }
  };

  const inputClass =
    "w-full border border-input bg-background p-2 rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none transition";
  const labelClass =
    "block text-xs font-bold text-muted-foreground uppercase mb-1.5";

  return (
    <>
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
        <h2 className="text-xl font-black text-foreground mb-6 font-nunito flex items-center gap-2">
          <Icon name="stock" className="w-5 h-5" />
          {initialData ? "Editar Producto" : "Nuevo Producto"}
        </h2>

        <form ref={formRef} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre del Producto *</label>
                <input
                  name="name"
                  defaultValue={initialData?.name}
                  type="text"
                  required
                  placeholder="Ej: Alimento Perro Adulto"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClass}>Tipo de Venta / Unidad</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitOfMeasure(UnitOfMeasure.UNIT)}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2",
                      unitOfMeasure === UnitOfMeasure.UNIT
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-muted border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon name="package" className="w-4 h-4" />
                    POR UNIDAD
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitOfMeasure(UnitOfMeasure.GRAM)}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2",
                      unitOfMeasure === UnitOfMeasure.GRAM
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-muted border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon name="scale" className="w-4 h-4" />
                    POR PESO (KG)
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 px-1">
                  {unitOfMeasure === UnitOfMeasure.GRAM
                    ? "El stock se gestionará en gramos y el precio ingresado será por Kilogramo."
                    : "El stock se gestionará por unidades enteras."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Dueño *</label>
                <select
                  name="ownerId"
                  defaultValue={initialData?.ownerId || ""}
                  required
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>Categoría *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCategory(!isNewCategory)}
                    className="text-[10px] text-primary font-bold hover:underline uppercase flex items-center gap-1"
                  >
                    {isNewCategory ? (
                      "Cancelar"
                    ) : (
                      <>
                        <Icon name="plus" className="w-3 h-3" /> Nueva
                      </>
                    )}
                  </button>
                </div>
                {isNewCategory ? (
                  <input
                    name="categoryName"
                    type="text"
                    placeholder="Nombre nueva..."
                    className={cn(inputClass, "bg-primary/5 border-primary/20")}
                  />
                ) : (
                  <select
                    name="categoryId"
                    defaultValue={initialData?.categoryId || ""}
                    required
                    className={inputClass}
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-foreground">
                Variantes y Precios
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="text-xs bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-90 font-bold transition flex items-center gap-1"
              >
                <Icon name="plus" className="w-4 h-4" /> Agregar Variante
              </button>
            </div>
            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground px-2">
                <div className="col-span-4">Nombre</div>
                <div className="col-span-3">
                  Costo {unitOfMeasure === "GRAM" ? "(por Kg)" : ""}
                </div>
                <div className="col-span-3">
                  Venta {unitOfMeasure === "GRAM" ? "(por Kg)" : ""}
                </div>
                <div className="col-span-1 text-center">Stock</div>
                <div className="col-span-1"></div>
              </div>
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-card p-3 md:p-0 rounded-lg md:bg-transparent border md:border-0 border-border mb-2 md:mb-0 shadow-sm md:shadow-none"
                >
                  <div className="col-span-4">
                    <span className="md:hidden text-xs font-bold text-muted-foreground block mb-1">
                      Nombre Variante
                    </span>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(idx, "name", e.target.value)
                      }
                      placeholder="Ej: 20kg, Pollo..."
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground md:hidden w-12">
                      Costo:
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.costPrice}
                      onChange={(e) =>
                        updateVariant(
                          idx,
                          "costPrice",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground md:hidden w-12">
                      Venta:
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.salePrice}
                      onChange={(e) =>
                        updateVariant(
                          idx,
                          "salePrice",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className={cn(
                        inputClass,
                        "font-bold text-green-600 dark:text-green-400",
                      )}
                    />
                  </div>
                  <div className="col-span-1 text-center text-xs font-mono text-muted-foreground hidden md:block">
                    {variant.id
                      ? unitOfMeasure === "GRAM"
                        ? `${variant.stock / 1000}kg`
                        : variant.stock
                      : "-"}
                  </div>
                  <div className="col-span-1 text-right md:text-center">
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-muted-foreground hover:text-destructive transition p-1 bg-muted md:bg-transparent rounded-lg"
                    >
                      <Icon name="close" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CollapsibleSection title="Detalles Adicionales" iconName="notebook">
            <div>
              <label className={labelClass}>Descripción (Opcional)</label>
              <textarea
                name="description"
                defaultValue={initialData?.description || ""}
                className={inputClass}
                rows={3}
                placeholder="Detalles internos o características..."
              />
            </div>
          </CollapsibleSection>

          {showImages && (
            <CollapsibleSection
              title="Imagen del Producto"
              iconName="camera"
              defaultOpen={!!imageUrl}
            >
              <div className="pt-4 flex flex-col md:flex-row gap-6 items-start">
                {imageUrl && (
                  <div className="relative w-full aspect-video md:w-32 md:aspect-square rounded-xl overflow-hidden border border-border bg-muted shrink-0">
                    <Image
                      src={imageUrl}
                      alt="Previsualización"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 w-full">
                  <label className={labelClass}>
                    {imageUrl ? "Cambiar Imagen" : "Subir Nueva"}
                  </label>
                  <ImageUpload onImageUpload={(url) => setImageUrl(url)} />
                </div>
              </div>
            </CollapsibleSection>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={handlePreValidate}
              className="w-full py-4 text-lg font-bold bg-foreground text-background rounded-xl hover:opacity-90 transition shadow-lg active:scale-[0.98]"
            >
              {initialData ? "GUARDAR CAMBIOS" : "GUARDAR PRODUCTO"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title={initialData ? "¿Guardar Cambios?" : "¿Crear Producto?"}
        description={
          initialData
            ? "Se actualizará la información del producto."
            : "Estás a punto de crear un producto nuevo."
        }
        confirmText="Confirmar"
        variant="default"
      />
    </>
  );
}
