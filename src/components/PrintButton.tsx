"use client";

import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Icon } from "@/components/ui/Icon";

export default function PrintButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    const input = document.getElementById("pdf-report-target");
    if (!input) return;

    setIsGenerating(true);

    try {
      input.classList.remove("hidden");
      input.style.position = "fixed";
      input.style.left = "0";
      input.style.top = "0";
      input.style.zIndex = "9999";
      input.style.backgroundColor = "white";
      input.style.visibility = "visible";

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("pdf-report-target");
          if (el) el.style.display = "block";
        },
      });

      input.classList.add("hidden");
      input.style.position = "";
      input.style.left = "";
      input.style.top = "";
      input.style.visibility = "";

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: imgHeight > 297 ? [imgWidth, imgHeight] : "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`reporte-guapecanes-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error capturando PDF:", error);
      alert("Hubo un error al generar el PDF. Por favor, intente de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
    >
      <Icon
        name={isGenerating ? "loader" : "download"}
        className={isGenerating ? "animate-spin w-4 h-4" : "w-4 h-4"}
      />
      <span className="text-xs font-black uppercase tracking-widest">
        {isGenerating ? "Procesando..." : "Exportar PDF"}
      </span>
    </button>
  );
}
