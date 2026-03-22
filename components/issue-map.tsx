"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import MapGL, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapPopup } from "@/components/map-popup";
import { MapFilter, type Filters } from "@/components/map-filter";
import { type Report, mockReports, VANCOUVER_CENTER } from "@/lib/mock-data";

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function IssueMap({
  onReportClick,
}: {
  onReportClick?: () => void;
}) {
  const mapRef = useRef<MapRef>(null);
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

  const handleRecenter = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
        });
      },
      () => {
        mapRef.current?.flyTo({
          center: [VANCOUVER_CENTER.lng, VANCOUVER_CENTER.lat],
          zoom: 12,
        });
      }
    );
  }, []);

  return (
    <div className="relative flex-1">
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: VANCOUVER_CENTER.lng,
          latitude: VANCOUVER_CENTER.lat,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
      >
        <NavigationControl position="top-right" />

        {/* Pins */}
        {filtered.map((report) => (
          <Marker
            key={report.id}
            longitude={report.lng}
            latitude={report.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(report);
            }}
          >
            <div
              className={`h-3.5 w-3.5 cursor-pointer rounded-full border-2 border-white shadow-md transition-transform hover:scale-125 ${
                report.status === "Open" ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </Marker>
        ))}

        {/* Popup */}
        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            onClose={() => setSelected(null)}
            closeOnClick={false}
            maxWidth="280px"
          >
            <MapPopup report={selected} />
          </Popup>
        )}
      </MapGL>

      {/* Controls overlay */}
      <div className="absolute bottom-6 left-4 flex flex-col gap-2">
        <div className="relative">
          <MapFilter filters={filters} onChange={setFilters} />
        </div>
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
      </div>

      {/* CTA */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <Button size="lg" className="shadow-lg" onClick={onReportClick}>
          <Plus className="mr-2 h-4 w-4" />
          Report Issue Here
        </Button>
      </div>
    </div>
  );
}
