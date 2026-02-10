'use client'

import { useState } from "react"
import { deleteUser } from "@/actions/user-actions"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/ui/Toast"

interface Props {
  userId: string
  userName: string
  currentUserId: string
}

export default function DeleteUserButton({ userId, userName, currentUserId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const isSelf = userId === currentUserId

  const handleDelete = async () => {
    if (isSelf) {
      addToast("Acción bloqueada: No puedes eliminar tu propia cuenta.", "error")
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await deleteUser(userId)
      
      if (res?.error) {
        addToast(res.error, "error")
      } else {
        addToast(`Usuario ${userName} eliminado correctamente.`, "success")
      }
    } catch (err) {
      addToast("Error al procesar la solicitud.", "error")
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-destructive font-bold text-xs transition-colors flex items-center gap-1 ml-auto group"
        title={isSelf ? "No puedes eliminarte a ti mismo" : "Revocar acceso"}
      >
        <Icon name="trash" className="w-3.5 h-3.5" /> ELIMINAR
      </button>

      <ConfirmModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        description={`¿Estás seguro de que deseas eliminar a ${userName}? Esta acción revocará su acceso al sistema de forma permanente.`}
        confirmText={loading ? "Eliminando..." : "Sí, eliminar"}
        variant="destructive"
      />
    </>
  )
}