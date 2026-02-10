"use client";

import { usePosContext } from "@/context/PosContext";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

interface PosHeaderProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export function PosHeader({ viewMode, setViewMode }: PosHeaderProps) {
  const {
    search,
    setSearch,
    categories,
    selectedCategory,
    setSelectedCategory,
  } = usePosContext();

  return (
    <div className="bg-card p-5 rounded-3xl shadow-sm border border-border space-y-4 shrink-0">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 pl-14 border border-input rounded-2xl bg-background text-lg font-bold focus:ring-2 focus:ring-ring outline-none transition placeholder:font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="hidden md:flex bg-muted p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-3 rounded-xl transition-all",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon name="layout" className="h-6 w-6" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-3 rounded-xl transition-all",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(cat === selectedCategory ? "ALL" : cat)
            }
            className={cn(
              "px-5 py-2 rounded-full text-sm font-black whitespace-nowrap border transition",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground",
            )}
          >
            {cat === "ALL" ? "TODO" : cat.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
