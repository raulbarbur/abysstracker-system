"use client";

import { useState } from "react";
import readXlsxFile from "read-excel-file";
import {
  importProductBatch,
  generateBulkTemplate,
} from "@/actions/bulk-actions";
import { cn, downloadBase64File } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ExcelImporter() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [finalStats, setFinalStats] = useState({
    created: 0,
    updated: 0,
    stockMoves: 0,
    errors: 0,
  });

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const result = await generateBulkTemplate();
      if (result.success && result.base64 && result.filename) {
        downloadBase64File(result.base64, result.filename);
        addToast("Catálogo .xlsx descargado correctamente.", "info");
      } else {
        addToast(result.error || "Error al generar archivo.", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Error de conexión.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      addToast("Por favor suba un archivo Excel (.xlsx).", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("Error: El archivo es demasiado grande. Máximo 5MB.", "error");
      e.target.value = "";
      return;
    }

    try {
      const data = await readXlsxFile(file);
      const cleanData = data.slice(1).map((row) => ({
        name: row[0] as string,
        variantName: row[1] as string,
        categoryName: row[2] as string,
        ownerName: row[3] as string,
        cost: Number(row[4]),
        price: Number(row[5]),
        stock: row[6] ? Number(row[6]) : 0,
        unit: row[7] as string,
      }));

      setRows(cleanData);
      setLogs((prev) => [
        ...prev,
        `Archivo cargado: ${cleanData.length} filas detectadas.`,
      ]);
      setProgress({ current: 0, total: cleanData.length, errors: 0 });
      setFinalStats({ created: 0, updated: 0, stockMoves: 0, errors: 0 });
      setShowSummary(false);
      addToast("Archivo leído correctamente", "info");
    } catch (error) {
      console.error(error);
      addToast("Error leyendo Excel. Verifique el formato.", "error");
    }
  };

  const executeImport = async () => {
    setShowConfirm(false);
    setProcessing(true);
    setLogs([]);

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalStockMoves = 0;

    const BATCH_SIZE = 10;
    const batches = chunkArray(rows, BATCH_SIZE);

    let processedCount = 0;
    let errorCount = 0;
    let batchIndex = 1;

    for (const batch of batches) {
      try {
        const result = await importProductBatch(batch);

        if (result.success) {
          processedCount += batch.length;
          setLogs((prev) => [...prev, `Lote ${batchIndex}: OK`]);

          if (result.stats) {
            totalCreated += result.stats.created;
            totalUpdated += result.stats.updated;
            totalStockMoves += result.stats.stockMoves;
          }
        } else {
          errorCount += batch.length;
          setLogs((prev) => [
            ...prev,
            `Error Lote ${batchIndex}: ${result.error}`,
          ]);
        }
      } catch (err) {
        errorCount += batch.length;
        setLogs((prev) => [...prev, `Error crítico en Lote ${batchIndex}.`]);
      }

      setProgress((p) => ({
        current: processedCount + errorCount,
        total: rows.length,
        errors: errorCount,
      }));

      await delay(200);
      batchIndex++;
    }

    setProcessing(false);

    setFinalStats({
      created: totalCreated,
      updated: totalUpdated,
      stockMoves: totalStockMoves,
      errors: errorCount,
    });
    setShowSummary(true);

    if (errorCount === 0) {
      setRows([]);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative">
      <div className="p-6 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border shadow-sm">
            <Icon name="upload" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-black text-lg text-foreground">
              Carga de Datos
            </h2>
            <p className="text-xs text-muted-foreground">
              Arrastrá tu archivo o descargá el catálogo.
            </p>
          </div>
        </div>

        <button
          onClick={downloadTemplate}
          disabled={downloading}
          className={cn(
            "group flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95",
            downloading
              ? "bg-muted text-muted-foreground cursor-wait border-border"
              : "bg-green-600 hover:bg-green-700 text-white border-transparent hover:shadow-md",
          )}
        >
          {downloading ? (
            <>
              <Icon name="loader" className="w-4 h-4 animate-spin" />
              <span>Generando .xlsx...</span>
            </>
          ) : (
            <>
              <span>Bajar Catálogo Actual</span>
              <Icon name="download" className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {!processing && rows.length === 0 && !showSummary && (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all group relative overflow-hidden bg-background/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
              <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon name="plus" className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-sm font-black text-foreground mb-1">
                Subir Excel (.xlsx)
              </p>
              <p className="text-xs text-muted-foreground">
                Arrastrar y soltar aquí
              </p>
            </div>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}

        {showSummary && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Icon
                  name="check"
                  className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div>
                <h3 className="font-black text-lg text-emerald-900 dark:text-emerald-100">
                  Operación Finalizada
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Resumen de cambios aplicados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100/50">
                <p className="text-[10px] uppercase font-bold text-emerald-600/70">
                  Nuevos
                </p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  +{finalStats.created}
                </p>
              </div>
              <div className="bg-white dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100/50">
                <p className="text-[10px] uppercase font-bold text-emerald-600/70">
                  Actualizados
                </p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  {finalStats.updated}
                </p>
              </div>
              <div className="bg-white dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100/50">
                <p className="text-[10px] uppercase font-bold text-emerald-600/70">
                  Stock
                </p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  {finalStats.stockMoves > 0 ? "+" : ""}
                  {finalStats.stockMoves}
                </p>
              </div>
              <div className="bg-white dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100/50">
                <p className="text-[10px] uppercase font-bold text-red-400">
                  Errores
                </p>
                <p className="text-2xl font-black text-red-500">
                  {finalStats.errors}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSummary(false);
                setLogs([]);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition active:scale-95"
            >
              Aceptar y Cerrar
            </button>
          </div>
        )}

        {((rows.length > 0 && !showSummary) || processing) && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <Icon
                  name="notebook"
                  className="w-5 h-5 text-muted-foreground"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {processing ? "Procesando..." : "Archivo Cargado"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {rows.length} registros detectados
                  </p>
                </div>
              </div>
              {!processing && (
                <button
                  onClick={() => {
                    setRows([]);
                    setLogs([]);
                  }}
                  className="text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  Cancelar
                </button>
              )}
            </div>

            {(processing || progress.current > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                  <span>Progreso</span>
                  <span>
                    {Math.round((progress.current / progress.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      progress.errors > 0 ? "bg-orange-500" : "bg-primary",
                    )}
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!processing && progress.current === 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Icon name="rocket" className="w-4 h-4" />
                Impactar en Base de Datos
              </button>
            )}

            <div className="bg-slate-950 dark:bg-black p-4 rounded-xl border border-border h-48 overflow-y-auto custom-scrollbar font-mono text-[10px] text-slate-300 shadow-inner">
              {logs.length === 0 ? (
                <span className="opacity-30 italic">Esperando inicio...</span>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      "mb-1 border-b border-white/5 pb-1",
                      log.includes("Error")
                        ? "text-red-400"
                        : "text-emerald-400",
                    )}
                  >
                    <span className="opacity-40 mr-2">
                      [{new Date().toLocaleTimeString()}]
                    </span>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={executeImport}
          title="¿Confirmar Importación?"
          description={`Se procesarán ${rows.length} registros. Esta acción es irreversible.`}
        />
      </div>
    </div>
  );
}
