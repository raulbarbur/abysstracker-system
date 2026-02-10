import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SearchInput from "@/components/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { DeletePetButton } from "@/components/pets/DeletePetButton";
import { Icon } from "@/components/ui/Icon";
import { PetForm } from "@/components/PetForm";

interface Props {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function PetsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params?.query || "";
  const currentPage = Number(params?.page) || 1;
  const ITEMS_PER_PAGE = 15;

  const whereCondition = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { ownerName: { contains: query, mode: "insensitive" as const } },
          { breed: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [totalItems, pets] = await Promise.all([
    prisma.pet.count({ where: whereCondition }),
    prisma.pet.findMany({
      where: whereCondition,
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">
          Mascotas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Base de clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PetForm />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SearchInput placeholder="Buscar por mascota, dueño o raza..." />

          <div className="grid gap-4">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-card p-4 rounded-2xl shadow-sm border border-border flex justify-between items-start hover:border-primary/50 transition duration-200"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-foreground">
                      {pet.name}
                    </h3>
                    <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-lg uppercase">
                      {pet.breed}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-bold">Dueño:</span> {pet.ownerName}
                    <span className="text-border">|</span>
                    <span className="text-green-600 dark:text-green-400 font-mono text-xs flex items-center gap-1">
                      <Icon name="phone" className="w-3 h-3" />
                      {pet.ownerPhone}
                    </span>
                  </div>
                  {pet.notes && (
                    <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20 inline-flex items-center gap-2 font-medium">
                      <Icon name="alert" className="w-3 h-3 shrink-0" />
                      {pet.notes}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Link
                    href={`/pets/${pet.id}`}
                    className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/20 border border-primary/10 transition"
                  >
                    VER FICHA
                  </Link>

                  <DeletePetButton id={pet.id} petName={pet.name} />
                </div>
              </div>
            ))}

            {pets.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-card rounded-3xl border border-dashed border-border opacity-70 flex flex-col items-center">
                <div className="mb-2 opacity-50">
                  <Icon name="pets" className="w-10 h-10" />
                </div>
                {query
                  ? "No encontré mascotas con ese nombre."
                  : "No hay mascotas registradas."}
              </div>
            )}

            <div className="pt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
