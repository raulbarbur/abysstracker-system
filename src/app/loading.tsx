"use client";

import { Icon } from "@/components/ui/Icon";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full gap-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-muted opacity-30"></div>

        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin shadow-lg shadow-primary/20"></div>

        <div className="absolute inset-0 flex items-center justify-center animate-pulse text-primary">
          <Icon name="pets" className="w-6 h-6" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <h3 className="text-foreground font-black font-nunito text-lg tracking-tight">
          Cargando
        </h3>
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          Preparando entorno...
        </p>
      </div>
    </div>
  );
}
