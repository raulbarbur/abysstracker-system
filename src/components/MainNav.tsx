"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/actions/auth-actions";
import { Icon, IconName } from "@/components/ui/Icon";

interface MainNavProps {
  role?: string;
  userName?: string;
}

type RouteItem = {
  href: string;
  label: string;
  icon: IconName;
  exact: boolean;
  highlight?: boolean;
};

type RouteGroup = {
  title: string | null;
  items: RouteItem[];
};

const STAFF_ALLOWED_PREFIXES = ["/pos", "/agenda", "/pets"];

export default function MainNav({
  role = "STAFF",
  userName = "Usuario",
}: MainNavProps) {
  const pathname = usePathname();

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (pathname === "/login") return null;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": true,
  });

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState === "true") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const toggleGroup = (index: number) => {
    const key = String(index);
    setClosedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allGroups: RouteGroup[] = [
    {
      title: "Operaciones",
      items: [
        { href: "/dashboard", label: "Inicio", icon: "dashboard", exact: true },
        {
          href: "/pos",
          label: "Caja",
          icon: "pos",
          exact: true,
          highlight: true,
        },
        { href: "/agenda", label: "Agenda", icon: "calendar", exact: false },
      ],
    },
    {
      title: "Gestión",
      items: [
        { href: "/sales", label: "Ventas", icon: "sales", exact: false },
        { href: "/products", label: "Productos", icon: "stock", exact: false },
        {
          href: "/categories",
          label: "Categorías",
          icon: "list",
          exact: false,
        },
      ],
    },
    {
      title: "Directorio",
      items: [
        {
          href: "/customers",
          label: "Clientes",
          icon: "customers",
          exact: false,
        },
        { href: "/pets", label: "Mascotas", icon: "pets", exact: false },
        { href: "/owners", label: "Dueños", icon: "owners", exact: false },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          href: "/owners/balance",
          label: "Finanzas",
          icon: "finance",
          exact: true,
        },
        {
          href: "/admin/reports",
          label: "Reportes",
          icon: "reports",
          exact: false,
        },
        { href: "/admin/users", label: "Usuarios", icon: "team", exact: false },
      ],
    },
  ];

  const isAdmin = role === "ADMIN";

  const groups = allGroups
    .map((group) => {
      if (isAdmin) return group;
      const filteredItems = group.items.filter((item) =>
        STAFF_ALLOWED_PREFIXES.some((prefix) => item.href.startsWith(prefix)),
      );
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);

  const initials = userName ? userName.substring(0, 2).toUpperCase() : "US";

  if (!isMounted)
    return <div className="hidden md:flex w-80 h-screen bg-card" />;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="p-8 pb-6 flex items-center justify-between shrink-0">
        <div className="overflow-hidden whitespace-nowrap">
          <h1 className="text-2xl font-black font-nunito tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-foreground">
            ABYSSTRACKER
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest truncate">
            Sistema Profesional v3
          </p>
        </div>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 bg-secondary rounded-full text-foreground hover:bg-secondary/80 transition-colors"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-2">
        {groups.map((group, groupIndex) => {
          const key = String(groupIndex);
          const isGroupOpen = !closedGroups[key];

          return (
            <div
              key={groupIndex}
              className={cn(
                "transition-all duration-300 ease-in-out",
                groupIndex > 0 && "pt-2 border-t border-border/50",
              )}
            >
              {group.title && (
                <div
                  onClick={() => toggleGroup(groupIndex)}
                  className="px-4 py-2 flex items-center justify-between cursor-pointer group/header hover:text-foreground text-muted-foreground transition-colors"
                >
                  <h4 className="text-[10px] uppercase tracking-widest font-bold">
                    {group.title}
                  </h4>
                  <div
                    className={cn(
                      "transition-transform duration-200",
                      isGroupOpen ? "rotate-90" : "rotate-0",
                    )}
                  >
                    <Icon name="chevronRight" className="h-3 w-3" />
                  </div>
                </div>
              )}

              {isGroupOpen && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200 fade-in">
                  {group.items.map((route) => {
                    const isActive = route.exact
                      ? pathname === route.href
                      : pathname.startsWith(route.href);

                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 rounded-2xl ml-2 border-l-2 border-transparent transition-all duration-200 group",
                          "text-sm font-bold",
                          route.highlight
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 mb-4 mt-2 ml-0 border-none justify-center text-base"
                            : isActive
                              ? "border-primary bg-primary/5 text-primary"
                              : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground",
                        )}
                      >
                        <Icon
                          name={route.icon}
                          className={cn(
                            "transition-transform group-hover:scale-110 shrink-0",
                            route.highlight
                              ? "h-6 w-6 animate-pulse"
                              : "h-5 w-5",
                          )}
                        />

                        <span className="whitespace-nowrap overflow-hidden w-auto opacity-100">
                          {route.label}
                        </span>

                        {!route.highlight && isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3 shrink-0 bg-card z-10 pb-safe md:pb-4">
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-2xl border border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-bold text-foreground truncate"
                title={userName}
              >
                {userName}
              </p>
              <p className="text-[10px] text-green-500 font-bold uppercase truncate flex items-center gap-1">
                <Icon name="check" className="h-2 w-2 text-green-500" />
                {role}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <form action={logout}>
          <button
            type="submit"
            disabled={isDemoMode}
            title={
              isDemoMode
                ? "Cerrar sesión deshabilitado en modo demo"
                : "Cerrar sesión"
            }
            className={cn(
              "flex items-center justify-center gap-2 transition text-xs font-bold w-full py-2.5 rounded-xl",
              isDemoMode
                ? "text-muted-foreground/40 bg-muted/20 cursor-not-allowed opacity-70"
                : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            )}
          >
            <Icon name="logout" className="h-4 w-4" />
            <span>{isDemoMode ? "Sesión de Invitado" : "Cerrar Sesión"}</span>
          </button>
        </form>

        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-full h-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          title="Ocultar Menú"
        >
          <Icon
            name={isCollapsed ? "chevronRight" : "chevronLeft"}
            className="h-4 w-4"
          />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-background hidden md:flex",
          !isCollapsed && "opacity-0 pointer-events-none scale-0",
        )}
        title="Abrir Menú"
      >
        <Icon name="chevronRight" className="h-6 w-6" />
      </button>

      <aside
        className={cn(
          "hidden md:flex flex-col bg-card h-screen sticky top-0 z-40 transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap border-r border-border",
          isCollapsed ? "w-0 border-none opacity-0" : "w-80 opacity-100",
        )}
      >
        <SidebarContent />
      </aside>

      <header
        className={cn(
          "md:hidden fixed left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-4 transition-all duration-300",
          isDemoMode ? "top-[33px]" : "top-0",
        )}
      >
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>

        <div className="text-lg font-black text-foreground font-nunito tracking-tight capitalize">
          {pathname === "/" ? "Inicio" : pathname.split("/")[1]}
        </div>

        <div className="w-8"></div>
      </header>

      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-all duration-300",
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
          isDemoMode && "top-[33px]",
        )}
      >
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            mobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          className={cn(
            "absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-card border-r border-border transition-transform duration-300 ease-in-out shadow-2xl",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarContent />
        </aside>
      </div>
    </>
  );
}
