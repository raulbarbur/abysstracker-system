export const dynamic = "force-dynamic";

import ExcelImporter from "@/components/ExcelImporter";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/shared/PageHeader";

export default function ImportPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors w-fit"
        >
          <Icon name="arrowLeft" className="w-3 h-3" /> Volver a Productos
        </Link>
        <PageHeader
          title="Importación y Actualización"
          description="Herramienta unificada para gestionar el inventario masivamente."
        />
      </div>

      <div className="w-full">
        <ExcelImporter />
      </div>

      <div className="text-center opacity-50 text-[10px] uppercase tracking-widest pt-4">
        Sistema de Gestión Unificada v2.0
      </div>
    </div>
  );
}
