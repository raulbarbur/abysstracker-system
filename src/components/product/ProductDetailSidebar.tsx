import { Prisma, UnitOfMeasure } from "@prisma/client"
import StockMovementForm from "@/components/StockMovementForm"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"

type Variant = Prisma.ProductVariantGetPayload<{}>

type FormOption = {
  variantId: string
  productName: string
  ownerName: string
  stock: number
  unitOfMeasure: UnitOfMeasure
}

interface ProductDetailSidebarProps {
  variants: Variant[]
  formOptions: FormOption[]
  productId: string
  totalCostValue: number
}

export function ProductDetailSidebar({ variants, formOptions, productId, totalCostValue }: ProductDetailSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-8">
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                  <Icon name="stock" className="w-4 h-4" />
                  Variantes
              </h2>
          </div>
          <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase">
                  <tr>
                      <th className="p-3 text-left">Nombre</th>
                      <th className="p-3 text-right">Precio</th>
                      <th className="p-3 text-center">Stock</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-border">
                  {variants.map(v => (
                      <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground">{v.name}</td>
                          <td className="p-3 text-right text-muted-foreground font-mono">${Number(v.salePrice)}</td>
                          <td className="p-3 text-center">
                              <span className={cn(
                                  "font-bold px-2 py-0.5 rounded text-xs border",
                                  v.stock === 0 
                                      ? 'bg-destructive/10 text-destructive border-destructive/20' 
                                      : 'bg-secondary text-secondary-foreground border-transparent'
                              )}>
                                  {v.stock}
                              </span>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <div className="bg-card p-6 rounded-3xl border border-border shadow-lg shadow-primary/5">
          <h3 className="font-bold text-foreground mb-6 border-b border-border pb-2 flex items-center gap-2">
              <Icon name="stock" className="w-5 h-5 text-primary" />
              Ajuste Rápido de Stock
          </h3>
          <StockMovementForm 
              products={formOptions} 
              redirectPath={`/products/${productId}`} 
          />
      </div>

      <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400">
          <p className="font-bold mb-1 uppercase tracking-wide flex items-center gap-1">
              <Icon name="info" className="w-3 h-3" />
              Dato Financiero
          </p>
          <p>Costo inmovilizado en stock: <strong className="text-sm">${totalCostValue.toLocaleString()}</strong></p>
      </div>
    </div>
  )
}