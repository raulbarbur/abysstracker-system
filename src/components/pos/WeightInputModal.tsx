'use client'

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';

interface WeightInputModalProps {
  productName: string;
  onClose: () => void;
  onConfirm: (weightInKg: number) => void;
}

export function WeightInputModal({ productName, onClose, onConfirm }: WeightInputModalProps) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<'KG' | 'GR'>('KG');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const timer = setTimeout(() => {
        inputRef.current?.focus();
    }, 100);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeydown);
    
    document.body.style.overflow = 'hidden';
    
    return () => {
        window.removeEventListener('keydown', handleKeydown);
        clearTimeout(timer);
        document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleConfirm = () => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numValue) && numValue > 0) {
      const weightInKg = mode === 'GR' ? numValue / 1000 : numValue;
      onConfirm(weightInKg);
    }
  };

  const modalContent = (
    <div 
        className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm" 
        onClick={onClose}
    >
      <div 
        className="bg-card rounded-3xl w-full max-w-md border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
              <div className="min-w-0">
                  <h3 className="font-black text-xl mb-1">Ingresar Cantidad</h3>
                  <p className="text-primary font-bold text-lg truncate">
                      {productName}
                  </p>
              </div>
              <div className="flex bg-muted p-1 rounded-xl border border-border h-fit flex-shrink-0 ml-2">
                  <button 
                      onClick={() => { setMode('KG'); inputRef.current?.focus(); }}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition", mode === 'KG' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                  >KG</button>
                  <button 
                      onClick={() => { setMode('GR'); inputRef.current?.focus(); }}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition", mode === 'GR' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                  >GR</button>
              </div>
          </div>
        </div>

        <div className="px-4 md:px-6 flex-1 flex flex-col justify-center overflow-y-auto">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    className="w-full bg-background border-2 border-border text-4xl sm:text-5xl font-black text-center p-4 md:p-6 rounded-2xl focus:outline-none focus:border-primary transition shadow-inner"
                    placeholder={mode === 'KG' ? "0,00" : "0"} 
                />
                <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-xl md:text-2xl font-black text-muted-foreground/30 uppercase pointer-events-none">
                    {mode}
                </span>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4 p-4 md:p-6 flex-shrink-0 pb-safe">
            <button
                onClick={onClose}
                className="py-3 md:py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition"
            >
                Cancelar
            </button>
            <button
                onClick={handleConfirm}
                className="py-3 md:py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition active:scale-95 shadow-lg shadow-primary/20"
            >
                <Icon name="check" className="h-5 w-5"/>
                Confirmar
            </button>
        </div>
      </div>
    </div>
  );
  
  if (isMounted) {
    return createPortal(modalContent, document.body);
  }

  return null;
}