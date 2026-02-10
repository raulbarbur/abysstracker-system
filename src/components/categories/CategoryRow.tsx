"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { updateCategory, deleteCategory } from "@/actions/category-actions";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

interface CategoryRowProps {
  category: {
    id: string;
    name: string;
  };
}

export default function CategoryRow({ category }: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { addToast } = useToast();

  const handleUpdate = async () => {
    if (editName.trim() === category.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const result = await updateCategory(category.id, editName);
    setIsSaving(false);

    if (result.success) {
      addToast("Categoría actualizada", "success");
      setIsEditing(false);
    } else {
      addToast(result.error || "Error al actualizar", "error");
    }
  };

  const handleDelete = async () => {
    const result = await deleteCategory(category.id);

    if (result.success) {
      addToast("Categoría eliminada", "success");
      setShowDeleteConfirm(false);
    } else {
      addToast(result.error || "Error al eliminar", "error");
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors group">
        <td className="p-4 pl-6">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border border-primary rounded px-2 py-1 text-sm outline-none w-full max-w-[200px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditName(category.name);
                }
              }}
            />
          ) : (
            <span className="font-medium text-foreground">{category.name}</span>
          )}
        </td>

        <td className="p-4 text-right">
          <div className="flex justify-end items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition"
                  title="Guardar"
                >
                  <Icon name="check" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(category.name);
                  }}
                  disabled={isSaving}
                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition"
                  title="Cancelar"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition"
                  title="Editar nombre"
                >
                  <Icon name="edit" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                  title="Eliminar categoría"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`¿Eliminar "${category.name}"?`}
        description="Esta acción no se puede deshacer. Solo se permitirá si no hay productos asociados."
        confirmText="Sí, Eliminar"
        variant="destructive"
      />
    </>
  );
}
