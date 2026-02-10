"use client";

import {
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useState,
  RefObject,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePosContext } from "@/context/PosContext";
import { Icon } from "@/components/ui/Icon";
import { PosProductCard } from "./PosProductCard";
import { cn } from "@/lib/utils";

const ROW_GAP = 20;

function useContainerWidth(ref: RefObject<HTMLDivElement>) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

interface PosCatalogProps {
  viewMode: "grid" | "list";
}

export function PosCatalog({ viewMode }: PosCatalogProps) {
  const { filteredProducts, search, setSearch, setSelectedCategory } =
    usePosContext();
  const showImages = process.env.NEXT_PUBLIC_ENABLE_IMAGES === "true";
  const parentRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(parentRef);

  const { columns, rowHeight, isListView } = useMemo(() => {
    const isMobile = containerWidth < 768;
    const listView = isMobile || viewMode === "list";
    const cols = listView ? 1 : 3;
    const gap = ROW_GAP;

    let height;
    if (listView) {
      height = 125;
    } else {
      const cardWidth = (containerWidth - gap * (cols - 1) - 8) / cols;
      const textAreaHeight = 140;
      height = showImages ? cardWidth + textAreaHeight : 160;
    }
    return { columns: cols, rowHeight: height, isListView: listView };
  }, [containerWidth, viewMode, showImages]);

  const rowCount = Math.ceil(filteredProducts.length / columns);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + ROW_GAP,
    overscan: 3,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowHeight, rowVirtualizer]);

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
    >
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-60">
          <Icon
            name="search"
            className="h-20 w-20 mb-5 text-muted-foreground/50"
          />
          <p className="text-lg font-bold">Sin resultados para "{search}"</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("ALL");
            }}
            className="text-primary underline text-base mt-2 font-black"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
          className="mt-2"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columns;
            const rowProducts = filteredProducts.slice(
              startIndex,
              startIndex + columns,
            );
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${rowHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={cn(
                    "grid gap-5 h-full",
                    isListView ? "grid-cols-1" : "grid-cols-3",
                  )}
                >
                  {rowProducts.map((p) => (
                    <PosProductCard
                      key={p.id}
                      product={p}
                      isListView={isListView}
                      showImages={showImages}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
