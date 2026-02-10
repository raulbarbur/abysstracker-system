// src/components/ExportCustomersButton.tsx
'use client'

import { useState } from 'react'
import { exportCustomers } from '@/actions/export-actions'
import { downloadBase64File } from '@/lib/utils'

export default function ExportCustomersButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportCustomers() 
      
      if (result.success && result.base64 && result.filename) {
        downloadBase64File(result.base64, result.filename)
      } else {
        alert(`Error al exportar: ${result.error || "Error desconocido."}`)
      }
    } catch (error) {
      console.error("Error en ExportCustomersButton:", error)
      alert("Ocurrió un error inesperado al exportar.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 h-[42px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <>Cargando...</> 
      ) : (
        'Exportar Deudas'
      )}
    </button>
  )
}