"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AnnualData {
  month: number;
  total: number;
  count: number;
}

interface AnnualSummaryChartProps {
  data: AnnualData[];
  year: number;
}

export default function AnnualSummaryChart({
  data,
  year,
}: AnnualSummaryChartProps) {
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const maxTotal = useMemo(() => {
    const max = Math.max(...data.map((d) => d.total), 0);
    return max === 0 ? 1 : max;
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-2 md:h-[400px] pt-4 md:pt-12 pb-8 px-2">
      {data.map((item, idx) => {
        const percentage = (item.total / maxTotal) * 100;
        const isBestMonth = item.total === maxTotal && item.total > 0;

        return (
          <Link
            key={item.month}
            href={`?tab=mensual&year=${year}&month=${item.month}`}
            className="group relative flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-4 w-full md:w-auto md:h-full"
            style={{ "--percent": `${percentage}%` } as React.CSSProperties}
          >
            <span
              className={cn(
                "text-xs font-bold transition-colors w-10 md:w-auto shrink-0 md:order-last text-left md:text-center",
                isBestMonth
                  ? "text-primary font-black"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {months[idx]}
            </span>

            <div className="flex-1 md:w-12 md:h-full bg-muted/30 rounded-r-xl rounded-l-none md:rounded-t-xl md:rounded-b-none flex items-center md:items-end justify-start md:justify-center relative mr-16 md:mr-0">
              <div
                className={cn(
                  "transition-all duration-1000 ease-out relative",
                  "w-[var(--percent)] h-8 md:w-full md:h-[var(--percent)]",
                  "rounded-r-xl rounded-l-none md:rounded-t-xl md:rounded-b-none",
                  isBestMonth
                    ? "bg-gradient-to-r md:bg-gradient-to-t from-primary to-primary/60 shadow-lg"
                    : "bg-muted-foreground/30 group-hover:bg-primary/40",
                )}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <span className="absolute left-[calc(var(--percent)+8px)] md:hidden text-[10px] font-bold text-muted-foreground whitespace-nowrap transition-all duration-1000">
                {item.total > 0 ? formatCurrency(item.total) : "$0"}
              </span>
            </div>

            <div className="absolute -top-12 opacity-0 md:group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 hidden md:block">
              <div className="bg-popover text-popover-foreground text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-border whitespace-nowrap">
                <p className="text-[10px] opacity-70 uppercase mb-0.5">
                  {months[idx]} {year}
                </p>
                {formatCurrency(item.total)}
              </div>
              <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 mx-auto -mt-1" />
            </div>

            {isBestMonth && (
              <div className="absolute -top-7 text-[9px] font-black text-primary uppercase tracking-widest hidden md:block animate-pulse">
                Mejor Mes
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
