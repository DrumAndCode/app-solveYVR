"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Report } from "@/lib/mock-data";

interface MapContextValue {
  /** Call to fly the map to a report and select it */
  focusReport: (report: Report) => void;
  /** The report the map should fly to (consumed by IssueMap) */
  pendingFocus: Report | null;
  /** Clear after the map has consumed the focus */
  clearFocus: () => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [pendingFocus, setPendingFocus] = useState<Report | null>(null);

  const focusReport = useCallback((report: Report) => {
    setPendingFocus(report);
  }, []);

  const clearFocus = useCallback(() => {
    setPendingFocus(null);
  }, []);

  return (
    <MapContext.Provider value={{ focusReport, pendingFocus, clearFocus }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapFocus() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapFocus must be used within MapProvider");
  return ctx;
}
