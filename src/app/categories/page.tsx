// src/app/categories/page.tsx

export const dynamic = "force-dynamic";

import { createCategory } from "@/actions/category-actions";
import { prisma } from "@/lib/prisma";
import { AppCard } from "@/components/ui/shared/AppCard";
import { PageHeader } from "@/components/ui/shared/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { revalidatePath } from "next/cache";
import CategoryRow from "@/components/categories/CategoryRow";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  async function handleCreateCategory(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    if (!name || name.trim().length === 0) {
      return;
    }

    await createCategory(formData);
    revalidatePath("/categories");
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <PageHeader
        title="Gestión de Categorías"
        description="Añade o modifica las categorías de tus productos."
      />

      <AppCard>
        <form
          action={handleCreateCategory}
          className="flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="w-full">
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-1 block">
              Nueva Categoría
            </label>
            <input
              name="name"
              type="text"
              placeholder="Ingrese categoria..."
              required
              className="w-full border border-input bg-background p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>
          <SubmitButton
            loadingText="Creando..."
            className="w-full md:w-auto h-[42px] px-6 rounded-xl font-bold"
          >
            Crear
          </SubmitButton>
        </form>
      </AppCard>

      <AppCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border">
              <tr>
                <th className="p-4 pl-6">Nombre</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="p-12 text-center text-muted-foreground"
                  >
                    No hay categorías creadas.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <CategoryRow key={category.id} category={category} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
}
