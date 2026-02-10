"use client";

import { useState } from "react";
import { type User } from "@prisma/client";
import { AppCard } from "@/components/ui/shared/AppCard";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import DeleteUserButton from "@/components/users/DeleteUserButton";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";

interface UsersClientProps {
  users: User[];
  sessionUserId: string;
}

export default function UsersClient({
  users,
  sessionUserId,
}: UsersClientProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <>
      <AppCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border">
              <tr>
                <th className="p-4 pl-6">Usuario</th>
                <th className="p-4">Rol</th>
                <th className="p-4 text-center">Cambiar Contraseña</th>
                <th className="p-4 text-right pr-6">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-muted-foreground"
                  >
                    <Icon
                      name="team"
                      className="w-10 h-10 mx-auto mb-2 opacity-30"
                    />
                    No hay usuarios registrados aún.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider",
                          user.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedUser(user)}
                        title="Cambiar contraseña"
                        className="inline-flex items-center justify-center gap-2 bg-muted/50 hover:bg-primary/10 hover:text-primary text-muted-foreground px-3 py-1.5 rounded-lg transition text-xs font-bold"
                      >
                        <Icon name="key" className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cambiar</span>
                      </button>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.name}
                        currentUserId={sessionUserId}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

      {selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
