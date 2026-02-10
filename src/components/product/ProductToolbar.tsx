"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProductToolbarProps {
  owners: { id: string; name: string }[];
  query: string;
  ownerId: string;
  includeArchived: boolean;
  activeFiltersCount: number;
}

export function ProductToolbar({
  owners,
  query,
  ownerId,
  includeArchived,
  activeFiltersCount,
}: ProductToolbarProps) {
  const [isOpen, setIsOpen] = useState(activeFiltersCount > 0);
  const router = useRouter();

  const handleClear = () => {
    setIsOpen(false);
    router.push("/products");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm",
            isOpen
              ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
              : "bg-card text-foreground border-border hover:bg-accent",
          )}
        >
          <Icon name={isOpen ? "close" : "filter"} className="w-4 h-4" />
          <span>{isOpen ? "Ocultar Filtros" : "Buscar y Filtrar"}</span>

          {activeFiltersCount > 0 && !isOpen && (
            <span className="ml-1 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-2 ring-background">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && !isOpen && (
          <button
            onClick={handleClear}
            className="text-xs text-destructive hover:underline font-bold transition-all flex items-center gap-1"
          >
            <Icon name="trash" className="w-3 h-3" />
            Limpiar Filtros
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
          <form
            key={query + ownerId + includeArchived}
            className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end"
          >
            <div className="md:col-span-4 space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider">
                Búsqueda por nombre
              </label>
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                  name="query"
                  defaultValue={query}
                  placeholder="Ej: Alimento Perro..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider">
                Dueño / Proveedor
              </label>
              <div className="relative">
                <Icon
                  name="user"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                />
                <select
                  name="ownerId"
                  defaultValue={ownerId}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-accent/50 transition-all"
                >
                  <option value="">Todos los dueños</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center h-11">
              <label className="flex items-center gap-3 cursor-pointer group bg-muted/30 hover:bg-muted/60 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-border">
                <input
                  type="checkbox"
                  name="includeArchived"
                  value="true"
                  defaultChecked={includeArchived}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  Ver bajas
                </span>
              </label>
            </div>

            <div className="md:col-span-3 flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 h-11 border border-border bg-background hover:bg-muted text-muted-foreground font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="trash" className="w-4 h-4" />
                  <span>Limpiar</span>
                </button>
              )}

              <button
                type="submit"
                className={cn(
                  "h-11 bg-primary text-primary-foreground font-black text-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2",
                  activeFiltersCount > 0 ? "flex-[2]" : "flex-1",
                )}
              >
                <Icon name="check" className="w-4 h-4" />
                Aplicar Filtros
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
