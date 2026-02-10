"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface FilterValues {
  search?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

interface Props {
  defaultValues: FilterValues;
  users: { id: string; name: string | null }[];
}

export default function InventoryFilterPanel({ defaultValues, users }: Props) {
  const hasActiveFilters = !!(
    defaultValues.search ||
    defaultValues.dateFrom ||
    defaultValues.dateTo ||
    (defaultValues.type && defaultValues.type !== "ALL") ||
    (defaultValues.userId && defaultValues.userId !== "ALL")
  );

  const [isOpen, setIsOpen] = useState(hasActiveFilters);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-foreground font-bold">
          <div
            className={`p-2 rounded-lg transition-colors ${isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            <Icon name="filter" className="w-4 h-4" />
          </div>
          <span>Filtros Avanzados</span>
          {hasActiveFilters && !isOpen && (
            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Activos
            </span>
          )}
        </div>
        <Icon
          name="chevronDown"
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <form className="p-4 border-t border-border grid grid-cols-1 md:grid-cols-6 gap-4 items-end animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">
              Buscar
            </label>
            <input
              name="historySearch"
              defaultValue={defaultValues.search}
              placeholder="Producto o variante..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">
              Tipo
            </label>
            <select
              name="type"
              defaultValue={defaultValues.type || "ALL"}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="ALL">Todos</option>
              <option value="ENTRY">Ingresos</option>
              <option value="SALE">Ventas</option>
              <option value="ADJUSTMENT">Ajustes</option>
              <option value="OWNER_WITHDRAWAL">Retiros</option>
              <option value="RETURN">Devoluciones</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">
              Usuario
            </label>
            <select
              name="userId"
              defaultValue={defaultValues.userId || "ALL"}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="ALL">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">
                Desde
              </label>
              <input
                type="date"
                name="dateFrom"
                defaultValue={defaultValues.dateFrom}
                className="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm focus:ring-primary/20 focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">
                Hasta
              </label>
              <input
                type="date"
                name="dateTo"
                defaultValue={defaultValues.dateTo}
                className="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm focus:ring-primary/20 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded-lg text-sm transition shadow-sm border border-border"
            >
              Aplicar
            </button>
            {hasActiveFilters && (
              <a
                href="/inventory"
                className="px-3 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive rounded-lg transition flex items-center justify-center border border-transparent hover:border-destructive/20"
                title="Limpiar filtros"
              >
                <Icon name="close" className="w-4 h-4" />
              </a>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
