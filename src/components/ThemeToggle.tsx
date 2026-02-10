"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        p-2 rounded-full transition-all duration-300
        bg-secondary hover:bg-primary text-secondary-foreground hover:scale-110 shadow-lg
        flex items-center justify-center
      "
      aria-label="Cambiar tema"
    >
      <Icon name={theme === "dark" ? "moon" : "sun"} className="h-5 w-5" />
    </button>
  );
}
