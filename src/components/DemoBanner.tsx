// src/components/DemoBanner.tsx
import { Sparkles } from "lucide-react";

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-violet-950/90 border-b border-violet-500/30 py-2 px-4 z-[9999] backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-violet-200">
        <Sparkles className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 animate-pulse text-fuchsia-400" />
        <p className="text-[9px] md:text-xs font-bold tracking-[0.15em] uppercase italic text-center">
          <span className="opacity-80">Ambiente de Demo</span>
          <span className="mx-2 text-violet-500">|</span>
          <span className="text-fuchsia-400">Solo Lectura</span>
        </p>
      </div>
    </div>
  );
}