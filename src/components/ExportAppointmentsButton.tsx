"use client";

import { useState } from "react";
import { getAppointmentsHistory } from "@/actions/appointment-actions";
import { Icon } from "@/components/ui/Icon";

import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";

const getSpanishStatus = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "En progreso";
    case "COMPLETED":
      return "Completado";
    case "BILLED":
      return "Cobrado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
};

export default function ExportAppointmentsButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await getAppointmentsHistory();
      if (!result.success || !result.data) {
        alert("Error: No se pudieron obtener los datos para el reporte.");
        setLoading(false);
        return;
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFontSize(18);
      doc.setTextColor(33, 33, 33);
      doc.text("Historial de Turnos", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Reporte generado el: ${new Date().toLocaleDateString("es-AR")}`,
        14,
        30,
      );
      doc.text(`Total de registros: ${result.data.length}`, 14, 35);

      const tableData = result.data.map((row) => [
        new Date(row.startTime).toLocaleDateString("es-AR"),
        new Date(row.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        row.pet.name,
        row.pet.ownerName || "-",
        getSpanishStatus(row.status),
      ]);

      autoTable(doc, {
        head: [["Fecha", "Hora", "Mascota", "Dueño", "Estado"]],
        body: tableData,
        startY: 42,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        didParseCell: function (data: CellHookData) {
          const rawRowData = data.row.raw as string[];
          const status = rawRowData[4];
          if (status === "Cancelado") {
            data.cell.styles.textColor = "#95a5a6";
            data.cell.styles.fontStyle = "italic";
          } else if (status === "Cobrado") {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      const dateISO = new Date().toISOString().slice(0, 10);
      doc.save(`historial_turnos_${dateISO}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 h-[42px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
      ) : (
        <Icon name="download" className="w-4 h-4" />
      )}
      <span className="hidden md:inline">Exportar Historial</span>
    </button>
  );
}
