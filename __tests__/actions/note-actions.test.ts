import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNote, deleteNote } from "@/actions/note-actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    groomingNote: { create: vi.fn(), delete: vi.fn() },
  };
  return { prisma: prismaMock };
});

describe("Note Actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Debe crear una nota", async () => {
    const formData = new FormData();
    formData.append("petId", "pet-123");
    formData.append("content", "nota.");

    await createNote(formData);

    expect(prisma.groomingNote.create).toHaveBeenCalledWith({
      data: { petId: "pet-123", content: "nota." },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/pets/pet-123");
  });

  it("Debe borrar una nota correctamente", async () => {
    const formData = new FormData();
    formData.append("id", "note-1");
    formData.append("petId", "pet-123");

    await deleteNote(formData);

    expect(prisma.groomingNote.delete).toHaveBeenCalledWith({
      where: { id: "note-1" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/pets/pet-123");
  });
});
