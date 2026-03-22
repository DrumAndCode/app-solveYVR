"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Report } from "@/lib/mock-data";

export interface LocationInfo {
  lat: number;
  lng: number;
  address?: string;
}

interface MapContextValue {
  /** Call to fly the map to a report and select it */
  focusReport: (report: Report) => void;
  /** The report the map should fly to (consumed by IssueMap) */
  pendingFocus: Report | null;
  /** Clear after the map has consumed the focus */
  clearFocus: () => void;

  /** User's current GPS location (requested on mount) */
  userLocation: LocationInfo | null;

  /** Location selected for a new report (pin click → "Report here") */
  reportLocation: LocationInfo | null;
  /** Trigger a report at a specific location — opens chat with location context */
  startReportAt: (loc: LocationInfo) => void;
  /** Clear report location after chat has consumed it */
  clearReportLocation: () => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [pendingFocus, setPendingFocus] = useState<Report | null>(null);
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
  const [reportLocation, setReportLocation] = useState<LocationInfo | null>(null);

  const focusReport = useCallback((report: Report) => {
    setPendingFocus(report);
  }, []);

  const clearFocus = useCallback(() => {
    setPendingFocus(null);
  }, []);

  const startReportAt = useCallback((loc: LocationInfo) => {
    setReportLocation(loc);
  }, []);

  const clearReportLocation = useCallback(() => {
    setReportLocation(null);
  }, []);

  // Request geolocation on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Permission denied or error — leave null
      }
    );
  }, []);

  return (
    <MapContext.Provider
      value={{
        focusReport,
        pendingFocus,
        clearFocus,
        userLocation,
        reportLocation,
        startReportAt,
        clearReportLocation,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapFocus() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapFocus must be used within MapProvider");
  return ctx;
}
