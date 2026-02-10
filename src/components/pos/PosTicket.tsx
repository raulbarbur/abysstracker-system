'use client'

import { usePosContext } from "@/context/PosContext"
import { CustomerOption } from "@/types/customer"
import { PaymentMethod, CartItem } from "@/types/pos"
import { cn, formatCurrency, formatWeight } from "@/lib/utils"
import { Icon } from "@/components/ui/Icon"
import { PosCustomerSelector } from "./PosCustomerSelector"
import { UnitOfMeasure } from "@prisma/client"

interface PosTicketProps {
  customers: CustomerOption[];
  onNewCustomerClick: () => void;
}

export function PosTicket({ customers, onNewCustomerClick }: PosTicketProps) {
  const { 
    cart, total, paymentMethod, setPaymentMethod, loading, 
    selectedCustomerId, setSelectedCustomerId, removeFromCart, 
    handleCheckoutClick, updateCartItem, isPromotionMode, setIsPromotionMode 
  } = usePosContext();
  
  const getSubtotal = (item: CartItem) => {
    let subtotal = 0;
    const currentPrice = item.price ?? 0;
    if (item.unitOfMeasure === UnitOfMeasure.GRAM) {
      const pricePerGram = currentPrice / 1000;
      subtotal = item.quantity * pricePerGram;
    } else {
      subtotal = item.quantity * currentPrice;
    }
    return subtotal;
  }

  return (
    <div className="bg-card border-2 border-border rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden relative">
      <div className="p-6 border-b-2 border-border bg-muted/20 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-black text-2xl text-foreground font-nunito flex items-center gap-3">
            <Icon name="pos" className="h-6 w-6 text-primary" /> TICKET
          </h2>
          
          <button 
            onClick={() => setIsPromotionMode(!isPromotionMode)}
            className={cn(
              "text-[10px] font-black px-3 py-1.5 rounded-full border-2 transition-all flex items-center gap-2",
              isPromotionMode 
                ? "bg-purple-600 text-white border-purple-700 shadow-lg scale-105" 
                : "bg-background text-muted-foreground border-border hover:border-purple-300"
            )}
          >
            <Icon name="sparkles" className="h-3 w-3" />
            {isPromotionMode ? "PROMO ACTIVA" : "MODO NORMAL"}
          </button>
        </div>

        <div className="flex gap-2 relative z-20"> 
          <PosCustomerSelector customers={customers} selectedId={selectedCustomerId} onSelect={setSelectedCustomerId} onNewCustomer={onNewCustomerClick} />
          <button onClick={onNewCustomerClick} className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground transition-all border border-border">
            <Icon name="plus" className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-10">
            <Icon name="cart" className="h-28 w-28 mb-5 text-muted-foreground" />
            <p className="text-lg font-black text-foreground uppercase tracking-widest">Carrito vacío</p>
          </div>
        )}
        
        {cart.map((item, index) => {
          const isPriceEditable = item.type === 'SERVICE' || isPromotionMode;

          return (
            <div key={`${item.id}-${index}`} className="flex justify-between items-start p-4 bg-background/50 rounded-2xl border border-border/50 hover:border-primary/50 transition-all">
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-black text-foreground text-base leading-tight mb-1">{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                    {item.unitOfMeasure === 'GRAM' ? formatWeight(item.quantity) : `${item.quantity} u.`}
                  </span>
                  
                  <span className="text-xs font-bold text-muted-foreground">x</span>
                  
                  {isPriceEditable ? (
                    <div className="flex items-center gap-1 bg-primary/5 border border-primary/20 rounded px-2 py-0.5">
                      <span className="text-[10px] font-black text-primary">$</span>
                      <input 
                        type="number"
                        value={item.price}
                        onChange={(e) => updateCartItem(index, { price: Number(e.target.value) })}
                        className="w-20 bg-transparent border-none focus:ring-0 p-0 text-xs font-black text-primary"
                        onFocus={(e) => e.target.select()}
                      />
                      {item.unitOfMeasure === 'GRAM' && <span className="text-[10px] font-bold text-muted-foreground">/kg</span>}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {formatCurrency(item.price ?? 0)} {item.unitOfMeasure === 'GRAM' ? '/kg' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-black text-xl text-foreground">{formatCurrency(getSubtotal(item))}</span>
                <button onClick={() => removeFromCart(index)} className="text-[10px] font-black text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg uppercase tracking-tighter">ELIMINAR</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-card border-t-2 border-border z-10">
         <div className="grid grid-cols-3 gap-3 mb-6">
            {(["CASH", "TRANSFER", "CHECKING_ACCOUNT"] as PaymentMethod[]).map((m) => (
              <button 
                key={m} onClick={() => setPaymentMethod(m)}
                className={cn(
                  "p-3 rounded-2xl text-[10px] font-black border-2 transition-all flex flex-col items-center justify-center gap-2 h-20",
                  paymentMethod === m ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" : "bg-background border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                <Icon name={m === "CASH" ? "cash" : m === "TRANSFER" ? "bank" : "notebook"} className="h-6 w-6" />
                {m === "CASH" ? "EFECTIVO" : m === "TRANSFER" ? "TRANSF." : "CUENTA"}
              </button>
            ))}
         </div>
         <div className="flex justify-between items-end mb-6">
            <span className="text-muted-foreground text-sm font-black uppercase tracking-widest">TOTAL</span>
            <span className="text-5xl font-black text-foreground tracking-tighter">{formatCurrency(total)}</span>
         </div>
         <button 
          onClick={handleCheckoutClick} disabled={cart.length === 0 || loading}
          className={cn(
            "w-full py-5 rounded-2xl font-black text-2xl transition active:scale-95 text-primary-foreground shadow-2xl flex items-center justify-center gap-4",
            cart.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/30'
          )}
        >
          {loading ? <span className="animate-pulse">PROCESANDO...</span> : <><span>COBRAR</span><Icon name="arrowRight" className="h-7 w-7" /></>}
        </button>
      </div>
    </div>
  );
}