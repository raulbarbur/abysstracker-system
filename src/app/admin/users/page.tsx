export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import UserForm from "@/components/UserForm";
import { PageHeader } from "@/components/ui/shared/PageHeader";
import { getSession } from "@/lib/auth";
import UsersClient from "@/components/users/UsersClient";

export default async function UsersPage() {
  const [users, session] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    getSession(),
  ]);

  if (!session) {
    return (
      <div className="p-8 text-center text-destructive">
        Acceso no autorizado.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <PageHeader
        title="Gestión de Equipo"
        description="Control de acceso y roles del personal."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <UserForm />
        </div>

        <div className="lg:col-span-2">
          <UsersClient users={users} sessionUserId={session.userId} />
        </div>
      </div>
    </div>
  );
}
