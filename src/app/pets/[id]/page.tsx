import { prisma } from "@/lib/prisma";
import { createNote, deleteNote } from "@/actions/note-actions";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { Icon } from "@/components/ui/Icon";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params;

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
      },
      groomingNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!pet)
    return <div className="p-10 text-foreground">Mascota no encontrada</div>;

  async function createNoteAction(formData: FormData) {
    "use server";
    await createNote(formData);
  }

  async function deleteNoteAction(formData: FormData) {
    "use server";
    await deleteNote(formData);
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <Link
              href="/pets"
              className="text-xs font-bold text-primary hover:underline mb-2 block"
            >
              ← Volver al listado
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-foreground font-nunito">
                {pet.name}
              </h1>
              <span className="text-sm font-bold bg-secondary text-secondary-foreground px-3 py-1 rounded-xl border border-border">
                {pet.breed || "Mestizo"}
              </span>
            </div>
          </div>

          <div className="bg-card text-card-foreground px-5 py-3 rounded-2xl border border-border shadow-sm min-w-[150px] text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
              Visitas Totales
            </p>
            <p className="text-3xl font-black font-nunito">
              {pet.appointments.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <InfoCard iconName="owners" label="Dueño" value={pet.ownerName} />
          <InfoCard iconName="phone" label="Contacto" value={pet.ownerPhone} />
          {pet.notes && (
            <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl shadow-sm min-w-[200px] flex-1">
              <div className="w-10 h-10 flex items-center justify-center bg-destructive/10 text-destructive rounded-full shrink-0">
                <Icon name="adjustment" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                  Alerta Médica
                </p>
                <p className="font-bold text-sm text-foreground">{pet.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-yellow-500/5 p-6 rounded-3xl border border-yellow-500/20">
            <h2 className="font-bold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center gap-2">
              <Icon name="notebook" className="w-5 h-5" />
              Nueva Nota Técnica
            </h2>

            <form action={createNoteAction}>
              <input type="hidden" name="petId" value={pet.id} />
              <textarea
                name="content"
                required
                rows={3}
                className="w-full p-4 border border-yellow-500/20 rounded-xl bg-background text-foreground focus:ring-2 focus:ring-yellow-500 outline-none placeholder:text-muted-foreground resize-none"
                placeholder="Ej: Corte con alza 4, se portó bien..."
              ></textarea>
              <div className="mt-3 text-right">
                <SubmitButton className="bg-yellow-600 hover:bg-yellow-700 text-white border-none">
                  Guardar Nota
                </SubmitButton>
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-xl font-black mb-4 text-foreground font-nunito">
              Historial Técnico
            </h3>
            {pet.groomingNotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl opacity-60">
                No hay notas guardadas aún.
              </div>
            ) : (
              <div className="space-y-4">
                {pet.groomingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-card p-5 rounded-2xl shadow-sm border border-border group relative hover:border-primary/30 transition"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                      <p className="text-xs text-muted-foreground font-bold">
                        {note.createdAt.toLocaleDateString()} •{" "}
                        {note.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <form action={deleteNoteAction}>
                        <input type="hidden" name="id" value={note.id} />
                        <input type="hidden" name="petId" value={pet.id} />
                        <button className="text-destructive hover:underline text-[10px] font-bold opacity-0 group-hover:opacity-100 transition px-2 py-1">
                          BORRAR
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 className="text-xl font-black mb-4 text-foreground font-nunito">
            Historial de Visitas
          </h3>
          <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col max-h-[600px]">
            {pet.appointments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Sin visitas aún.
              </div>
            ) : (
              <div className="overflow-y-auto custom-scrollbar divide-y divide-border">
                {pet.appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 hover:bg-muted/30 transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-foreground text-sm">
                        {appt.startTime.toLocaleDateString()}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded font-black border uppercase",
                          appt.status === "COMPLETED" ||
                            appt.status === "BILLED"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            : appt.status === "CANCELLED"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                        )}
                      >
                        {appt.status === "BILLED" ? "COBRADO" : appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {appt.startTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
