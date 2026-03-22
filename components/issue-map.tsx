"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import MapGL, {
  Marker,
  NavigationControl,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { Button } from "@/components/ui/button";
import { MapPopup } from "@/components/map-popup";
import { MapFilter, type Filters } from "@/components/map-filter";
import { type Report, mockReports, VANCOUVER_CENTER } from "@/lib/mock-data";
import { useMapFocus } from "@/lib/map-context";

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-tiles",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

type PointProps = { report: Report };

export function IssueMap() {
  const mapRef = useRef<MapRef>(null);
  const { pendingFocus, clearFocus } = useMapFocus();
  const [selected, setSelected] = useState<Report | null>(null);
  const [filters, setFilters] = useState<Filters>({
    area: "all",
    department: "all",
    status: "all",
  });
  const [zoom, setZoom] = useState(12);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null
  );

  const filtered = useMemo(() => {
    return mockReports.filter((r) => {
      if (filters.area !== "all" && r.local_area !== filters.area) return false;
      if (filters.department !== "all" && r.department !== filters.department)
        return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  // Build supercluster index
  const index = useMemo(() => {
    const sc = new Supercluster<PointProps>({
      radius: 60,
      maxZoom: 16,
    });
    const points: Supercluster.PointFeature<PointProps>[] = filtered.map(
      (r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: { report: r },
      })
    );
    sc.load(points);
    return sc;
  }, [filtered]);

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    if (!bounds) return [];
    return index.getClusters(bounds, Math.floor(zoom));
  }, [index, bounds, zoom]);

  // Update bounds/zoom on map move
  const updateView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setBounds([
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ]);
    setZoom(map.getZoom());
  }, []);

  const onMove = useCallback(
    (e: ViewStateChangeEvent) => {
      updateView();
    },
    [updateView]
  );

  useEffect(() => {
    if (pendingFocus) {
      mapRef.current?.flyTo({
        center: [pendingFocus.lng, pendingFocus.lat],
        zoom: 16,
        duration: 1200,
      });
      setSelected(pendingFocus);
      clearFocus();
    }
  }, [pendingFocus, clearFocus]);

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

  // Click cluster → zoom in to expand
  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 20);
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: expansionZoom,
        duration: 500,
      });
    },
    [index]
  );

  return (
    <div className="absolute inset-0">
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: VANCOUVER_CENTER.lng,
          latitude: VANCOUVER_CENTER.lat,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onLoad={updateView}
        onMoveEnd={onMove}
      >
        <NavigationControl position="top-right" />

        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties as Record<string, unknown>;
          const isCluster = props.cluster;

          if (isCluster) {
            const count = props.point_count as number;
            const size = count < 10 ? 36 : count < 50 ? 44 : 52;
            return (
              <Marker
                key={`cluster-${feature.id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(
                    feature.id as number,
                    lng,
                    lat
                  );
                }}
              >
                <div
                  className="flex cursor-pointer items-center justify-center rounded-full bg-primary/90 font-semibold text-primary-foreground shadow-lg ring-4 ring-primary/20 transition-transform hover:scale-110"
                  style={{ width: size, height: size, fontSize: size * 0.35 }}
                >
                  {count}
                </div>
              </Marker>
            );
          }

          // Individual pin
          const report = (feature.properties as PointProps).report;
          return (
            <Marker
              key={report.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelected(report);
              }}
            >
              <svg
                className="cursor-pointer drop-shadow-lg transition-transform hover:scale-110"
                width="28"
                height="36"
                viewBox="0 0 28 36"
                fill="none"
              >
                <path
                  d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z"
                  fill={report.status === "Open" ? "#f59e0b" : "#10b981"}
                />
                <circle cx="14" cy="14" r="6" fill="white" />
              </svg>
            </Marker>
          );
        })}

        {/* Popup */}
        {selected && (
          <Marker
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            offset={[0, -40]}
            style={{ zIndex: 10 }}
          >
            <MapPopup
              report={selected}
              onClose={() => setSelected(null)}
            />
          </Marker>
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
    </div>
  );
}
