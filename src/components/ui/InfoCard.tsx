"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

interface InfoCardProps {
  iconName: IconName;
  label: string;
  value: string | null;
  action?: () => void;
  actionLabel?: string;
  className?: string;
  variant?: "default" | "large";
}

export function InfoCard({
  iconName,
  label,
  value,
  action,
  actionLabel,
  className,
  variant = "default",
}: InfoCardProps) {
  if (!value) return null;

  const isLarge = variant === "large";

  return (
    <div
      className={cn(
        "flex items-center bg-card border border-border rounded-xl shadow-sm min-w-[140px]",
        isLarge ? "p-5 gap-5" : "p-3 gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-secondary rounded-full shrink-0 text-foreground transition-all",
          isLarge ? "w-16 h-16" : "w-10 h-10",
        )}
      >
        <Icon name={iconName} className={cn(isLarge ? "w-8 h-8" : "w-5 h-5")} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-bold text-muted-foreground uppercase tracking-wider truncate transition-all",
            isLarge ? "text-xs mb-1" : "text-[10px]",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "font-black text-foreground truncate transition-all leading-tight",
            isLarge ? "text-3xl" : "text-sm",
          )}
          title={value}
        >
          {value}
        </p>
        {action && (
          <button
            onClick={action}
            className="text-[10px] text-primary font-bold hover:underline mt-0.5 block"
          >
            {actionLabel || "Acción"}
          </button>
        )}
      </div>
    </div>
  );
}
