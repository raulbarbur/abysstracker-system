"use client";

import { useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { CustomerOption } from "@/types/pos";

export function PosCustomerSelector({
  customers,
  selectedId,
  onSelect,
  onNewCustomer,
}: {
  customers: CustomerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNewCustomer: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = useMemo(() => {
    if (!query) return customers;
    const lower = query.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(lower));
  }, [customers, query]);

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      <button
        onClick={toggleOpen}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-xl text-base font-bold border transition outline-none group",
          selectedId
            ? "bg-primary/10 border-primary text-primary"
            : "bg-background border-input text-muted-foreground hover:border-primary/50",
        )}
      >
        <div className="flex items-center gap-3 truncate">
          <Icon name="user" className="h-5 w-5 shrink-0" />
          <span className="truncate">
            {selectedCustomer
              ? selectedCustomer.name
              : "Cliente Final (Anónimo)"}
          </span>
        </div>
        <Icon name="chevronDown" className="h-4 w-4 opacity-50 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar cliente..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-background border border-input rounded-lg pl-12 pr-4 py-3 text-base font-bold focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
            <button
              onClick={() => {
                onSelect("");
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg text-sm font-bold mb-1 transition flex items-center gap-3",
                selectedId === ""
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon name="user" className="h-4 w-4" /> Cliente Final (Anónimo)
            </button>
            {filteredCustomers.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs text-muted-foreground font-bold mb-3">
                  No encontrado
                </p>
                <button
                  onClick={() => {
                    onNewCustomer();
                    setIsOpen(false);
                  }}
                  className="text-primary text-sm font-black underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Icon name="plus" className="h-4 w-4" /> Crear "{query}"
                </button>
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg text-sm font-bold mb-1 transition flex flex-col",
                    selectedId === c.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span>{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
