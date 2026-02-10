"use client";

import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  hoverEffect?: boolean;
}

export function AppCard({
  children,
  className,
  noPadding = false,
  hoverEffect = false,
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-3xl shadow-sm transition-all duration-200 overflow-hidden",
        !noPadding && "p-6",
        hoverEffect &&
          "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
