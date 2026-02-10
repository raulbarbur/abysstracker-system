"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn, formatCurrency, formatWeight } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type TicketItem = {
  description: string;
  quantity: number;
  price: number;
  unitOfMeasure?: string | "GRAM" | "UNIT";
};

type TicketProps = {
  saleId: string;
  date: Date;
  items: TicketItem[];
  total: number;
  paymentMethod: string;
  onClose: () => void;
  mode?: "POS" | "HISTORY";
};

export default function TicketView({
  saleId,
  date,
  items,
  total,
  paymentMethod,
  onClose,
  mode = "POS",
}: TicketProps) {
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const element = ticketRef.current;
    if (!element) return;

    setDownloading(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("ticket-content");
          if (clonedElement) {
            clonedElement.style.height = "auto";
            clonedElement.style.overflow = "visible";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (imgHeight * contentWidth) / imgWidth;

      if (contentHeight > pdfHeight - 20) {
        const longPdf = new jsPDF("p", "mm", [pdfWidth, contentHeight + 20]);
        longPdf.addImage(
          imgData,
          "PNG",
          margin,
          10,
          contentWidth,
          contentHeight,
        );
        longPdf.save(`Ticket_${saleId.slice(0, 8)}.pdf`);
      } else {
        pdf.addImage(imgData, "PNG", margin, 10, contentWidth, contentHeight);
        pdf.save(`Ticket_${saleId.slice(0, 8)}.pdf`);
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un error al generar el comprobante.");
    } finally {
      setDownloading(false);
    }
  };

  const getItemSubtotal = (item: TicketItem) => {
    if (item.unitOfMeasure === "GRAM") {
      return (item.price / 1000) * item.quantity;
    }
    return item.price * item.quantity;
  };

  return (
    <div className="flex flex-col items-center py-10 min-h-screen h-auto p-4 animate-in zoom-in-95 duration-300 w-full bg-background/50">
      <div className="shadow-2xl rounded-sm overflow-visible w-full max-w-[400px] bg-white">
        <div
          ref={ticketRef}
          id="ticket-content"
          className="p-8 md:p-10 bg-white text-slate-900 w-full relative flex flex-col gap-6"
          style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
        >
          <div className="text-center border-b-2 border-slate-900 pb-4 flex flex-col items-center gap-2">
            <Icon name="pets" className="h-8 w-8 text-slate-900" />
            <div>
              <h2 className="text-3xl font-black tracking-tighter font-nunito text-slate-900 leading-none">
                ABYSSTRACKER
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
                {mode === "POS" ? "Comprobante Oficial" : "Copia de Archivo"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600">
            <div>
              <p className="font-bold text-[10px] uppercase text-slate-400">
                Fecha
              </p>
              <p className="font-mono font-bold text-slate-900">
                {new Date(date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[10px] uppercase text-slate-400">
                Hora
              </p>
              <p className="font-mono font-bold text-slate-900">
                {new Date(date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="font-bold text-[10px] uppercase text-slate-400">
                ID Operación
              </p>
              <p className="font-mono text-xs text-slate-900">
                #{saleId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[10px] uppercase text-slate-400">
                Método
              </p>
              <p className="font-bold text-slate-900 uppercase">
                {paymentMethod === "CASH"
                  ? "Efectivo"
                  : paymentMethod === "TRANSFER"
                    ? "Transferencia"
                    : "Cta. Corriente"}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="text-left py-1 font-bold">Cant. / Detalle</th>
                  <th className="text-right py-1 font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-800">
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 pr-2 align-top">
                      <div className="flex items-center flex-wrap gap-1">
                        {item.unitOfMeasure === "GRAM" ? (
                          <span className="font-bold text-slate-900">
                            {formatWeight(item.quantity)}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900">
                            {item.quantity} u.
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">x</span>
                        <span className="text-[10px] text-slate-500">
                          {formatCurrency(item.price)}
                          {item.unitOfMeasure === "GRAM" && "/kg"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-bold leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-2 text-right align-top font-mono font-bold">
                      {formatCurrency(getItemSubtotal(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100 mt-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Total
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="text-center space-y-1 mt-4 mb-2 flex flex-col items-center">
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-center">
              Gracias por confiar en nosotros
              <Icon name="pets" className="h-3 w-3 text-slate-400" />
            </p>
            <p className="text-[8px] text-slate-300 uppercase">
              Documento no válido como factura fiscal
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-30 bg-[linear-gradient(45deg,transparent_75%,#94a3b8_75%),linear-gradient(-45deg,transparent_75%,#94a3b8_75%)] bg-[length:12px_12px]"></div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-[400px]">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className={cn(
            "w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 text-white",
            downloading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-red-600 to-red-500 hover:to-red-600 hover:shadow-red-500/30",
          )}
        >
          {downloading ? (
            <>
              <Icon name="loader" className="h-5 w-5 animate-spin" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <Icon name="download" className="h-5 w-5" />
              <span>Descargar PDF</span>
            </>
          )}
        </button>

        <button
          onClick={onClose}
          disabled={downloading}
          className="w-full bg-card hover:bg-accent text-foreground border border-border font-bold py-4 rounded-xl shadow-sm transition active:scale-95 text-sm flex items-center justify-center gap-2"
        >
          {mode === "POS" ? (
            <>
              <Icon name="sparkles" className="h-4 w-4 text-primary" />
              <span>Nueva Venta</span>
            </>
          ) : (
            <>
              <Icon name="close" className="h-4 w-4" />
              <span>Cerrar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
