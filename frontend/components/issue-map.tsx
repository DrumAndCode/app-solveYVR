"use client";

import { useState, useCallback, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapPopup } from "@/components/map-popup";
import { MapFilter, type Filters } from "@/components/map-filter";
import { type Report, mockReports, VANCOUVER_CENTER } from "@/lib/mock-data";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

function MapPins({
  reports,
  selected,
  onSelect,
}: {
  reports: Report[];
  selected: Report | null;
  onSelect: (r: Report | null) => void;
}) {
  return (
    <>
      {reports.map((report) => (
        <AdvancedMarker
          key={report.id}
          position={{ lat: report.lat, lng: report.lng }}
          onClick={() => onSelect(report)}
        >
          <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white shadow-md ${
              report.status === "Open" ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
        </AdvancedMarker>
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => onSelect(null)}
          pixelOffset={[0, -8]}
        >
          <MapPopup report={selected} />
        </InfoWindow>
      )}
    </>
  );
}

function RecenterButton() {
  const map = useMap();

  const handleRecenter = useCallback(() => {
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        map.setZoom(15);
      },
      () => {
        // Permission denied — stay on Vancouver center
        map.panTo(VANCOUVER_CENTER);
      }
    );
  }, [map]);

  return (
    <Button
      size="icon"
      variant="secondary"
      className="h-8 w-8 shadow-md"
      onClick={handleRecenter}
      title="Center on my location"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      </svg>
    </Button>
  );
}

export function IssueMap({
  onReportClick,
}: {
  onReportClick?: () => void;
}) {
  const [selected, setSelected] = useState<Report | null>(null);
  const [filters, setFilters] = useState<Filters>({
    area: "all",
    department: "all",
    status: "all",
  });

  const filtered = useMemo(() => {
    return mockReports.filter((r) => {
      if (filters.area !== "all" && r.local_area !== filters.area) return false;
      if (filters.department !== "all" && r.department !== filters.department)
        return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="relative flex-1">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={VANCOUVER_CENTER}
          defaultZoom={12}
          mapId={MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI
          className="h-full w-full"
        >
          <MapPins
            reports={filtered}
            selected={selected}
            onSelect={setSelected}
          />
        </Map>

        {/* Controls overlay */}
        <div className="absolute bottom-6 left-4 flex flex-col gap-2">
          <div className="relative">
            <MapFilter filters={filters} onChange={setFilters} />
          </div>
          <RecenterButton />
        </div>

        {/* CTA */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <Button
            size="lg"
            className="shadow-lg"
            onClick={onReportClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Issue Here
          </Button>
        </div>
      </APIProvider>
    </div>
  );
}
