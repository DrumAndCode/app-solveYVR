"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GripHorizontal } from "lucide-react";
import { Nav } from "@/components/nav";
import { IssueMap } from "@/components/issue-map";
import { MapProvider, useMapFocus } from "@/lib/map-context";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/reports", label: "All Reports" },
  { href: "/my-reports", label: "My Reports" },
];

/** Navigate to home when a report location is set from the map pin */
function ReportLocationRouter({ onReport }: { onReport?: () => void }) {
  const { reportLocation } = useMapFocus();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (reportLocation) {
      onReport?.();
      if (pathname !== "/") {
        router.push("/");
      }
    }
  }, [reportLocation, pathname, router, onReport]);

  return null;
}

// Sheet snap points as percentage of viewport height from the bottom
const SNAP_PEEK = 30; // 30% visible (default)
const SNAP_HALF = 55; // 55% visible
const SNAP_FULL = 92; // 92% visible (nearly full)

function MobileSheet({ children }: { children: React.ReactNode }) {
  const [sheetHeight, setSheetHeight] = useState(SNAP_PEEK);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
    setDragging(true);
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    const deltaY = dragStartY.current - clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(SNAP_FULL, Math.max(15, dragStartHeight.current + deltaPercent));
    setSheetHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    // Snap to nearest point
    const snaps = [SNAP_PEEK, SNAP_HALF, SNAP_FULL];
    const closest = snaps.reduce((prev, curr) =>
      Math.abs(curr - sheetHeight) < Math.abs(prev - sheetHeight) ? curr : prev
    );
    setSheetHeight(closest);
  }, [sheetHeight]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);

    const onMouseMove = (ev: MouseEvent) => {
      handleDragMove(ev.clientY);
    };
    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  return (
    <div
      ref={sheetRef}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.1)]",
        !dragging && "transition-[height] duration-200 ease-out"
      )}
      style={{ height: `${sheetHeight}dvh` }}
    >
      {/* Drag handle */}
      <div
        className="flex shrink-0 cursor-grab items-center justify-center py-2 active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <GripHorizontal className="h-5 w-5 text-muted-foreground/40" />
      </div>
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <MapProvider>
    <ReportLocationRouter />
    <div className="relative flex h-full flex-1">
      {/* Map — always visible */}
      <div className="absolute inset-0 z-0">
        <IssueMap />
      </div>

      {/* Desktop: floating right pane */}
      <div className="relative z-10 hidden h-full md:flex md:my-6 md:mr-6 md:ml-auto md:h-[calc(100%-3rem)] md:w-[420px] md:shrink-0 md:flex-col md:overflow-hidden md:rounded-2xl md:bg-background md:shadow-md lg:w-[480px]">
        <Nav />
        <div className="flex shrink-0 items-center border-b px-4">
          <div className="flex flex-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative px-3 py-2.5 text-sm transition-colors hover:text-foreground",
                  (pathname === tab.href || (tab.href === "/reports" && pathname === "/"))
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
                {(pathname === tab.href || (tab.href === "/reports" && pathname === "/")) && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      {/* Mobile: bottom sheet over map */}
      <div className="md:hidden">
        <MobileSheet>
          <Nav />
          <div className="flex shrink-0 items-center border-b px-4">
            <div className="flex flex-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative px-3 py-2.5 text-sm transition-colors hover:text-foreground",
                    (pathname === tab.href || (tab.href === "/reports" && pathname === "/"))
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                  {(pathname === tab.href || (tab.href === "/reports" && pathname === "/")) && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
        </MobileSheet>
      </div>
    </div>
    </MapProvider>
  );
}
