"use client";

import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  iconName?: IconName;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  iconName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "border rounded-xl transition-all duration-200 overflow-hidden",
        isOpen
          ? "bg-card border-border shadow-sm"
          : "bg-muted/10 border-transparent",
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-2">
          {iconName && (
            <Icon
              name={iconName}
              className={cn(
                "transition-colors",
                isOpen ? "text-primary" : "text-muted-foreground",
              )}
            />
          )}
          <span
            className={cn(
              "font-bold text-sm uppercase tracking-wide transition-colors",
              isOpen
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            {title}
          </span>
        </div>
        <div
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        >
          <Icon name="chevronDown" className="h-4 w-4" />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
