'use client'

import { useState } from "react"
import { createAppointment } from "@/actions/appointment-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { Icon } from "@/components/ui/Icon"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

type Props = {
  pets: { id: string, name: string, breed: string | null }[]
  selectedDate: string 
}

export default function AppointmentForm({ pets, selectedDate }: Props) {
  const [loading, setLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [formData, setFormData] = useState<FormData | null>(null)
  
  const router = useRouter()
  const { addToast } = useToast()

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setFormData(data)
    setIsConfirming(true)
  }

  const handleConfirmAction = async () => {
    if (!formData) return

    setLoading(true)
    const result = await createAppointment(formData)
    setLoading(false)

    if (result.error) {
      throw new Error(result.error)
    } else {
      addToast("Turno agendado correctamente.", "success")
      const formEl = document.getElementById("appointment-form") as HTMLFormElement
      if(formEl) formEl.reset()
      router.refresh()
    }
  }

  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"
  const inputClass = "w-full p-2.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition [color-scheme:light] dark:[color-scheme:dark]"
  
  const petName = formData ? pets.find(p => p.id === formData.get('petId'))?.name : ''

  return (
    <>
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm sticky top-6">
        <h2 className="text-xl font-black mb-6 text-foreground font-nunito flex items-center gap-2">
          <Icon name="calendar" className="w-5 h-5" /> Agendar Turno
        </h2>
        
        <form id="appointment-form" onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClass}>Mascota</label>
              <Link href="/pets" className="text-[10px] font-bold text-primary hover:underline uppercase flex items-center gap-1">
                  <Icon name="plus" className="w-3 h-3" /> Nueva
              </Link>
            </div>
            <select name="petId" required className={inputClass}>
              <option value="">Seleccionar...</option>
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.breed || 'Sin raza'})</option>
              ))}
            </select>
          </div>
          <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" name="date" defaultValue={selectedDate} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hora Inicio</label>
              <input name="time" type="time" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Duración</label>
              <select name="duration" defaultValue="60" className={inputClass}>
                <option value="30">30 min</option>
                <option value="60">1 h</option>
                <option value="90">1 h 30m</option>
                <option value="120">2 hs</option>
                <option value="180">3 hs</option>
              </select>
            </div>
          </div>
          <button type="submit" className={cn("w-full py-3 rounded-xl font-bold transition text-primary-foreground shadow-lg active:scale-95 mt-2 bg-primary hover:bg-primary/90 shadow-primary/25")}>
            Confirmar Reserva
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleConfirmAction}
        title="¿Confirmar Nuevo Turno?"
        description={`Estás por agendar un turno para ${petName}. ¿Son correctos los datos?`}
        confirmText="Sí, agendar"
        variant="default" 
      />
    </>
  )
}