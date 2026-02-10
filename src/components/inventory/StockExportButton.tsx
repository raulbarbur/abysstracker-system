"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { exportStockHistory } from "@/actions/export-actions";
import { useToast } from "@/components/ui/Toast";

interface Props {
  filters: {
    search?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
  };
}

export default function StockExportButton({ filters }: Props) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await exportStockHistory(filters);

        if (!result.success || !result.base64) {
          throw new Error(result.error || "Error al generar el archivo");
        }

        const binaryString = window.atob(result.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "Historial_Stock.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast("Exportación completada con éxito", "success");
      } catch (error: any) {
        console.error(error);
        addToast(error.message || "Error al exportar", "error");
      }
    });
  };

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
    >
      {isPending ? (
        <Icon name="loader" className="animate-spin w-4 h-4" />
      ) : (
        <Icon name="download" className="w-4 h-4" />
      )}
      {isPending ? "Generando..." : "Exportar Excel"}
    </button>
  );
}
