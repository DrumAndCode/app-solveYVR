"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import MapGL, {
  Marker,
  NavigationControl,
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { MapPopup } from "@/components/map-popup";
import { MapFilter } from "@/components/map-filter";
import { type Report, toReport, VANCOUVER_CENTER } from "@/lib/mock-data";
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
  const { pendingFocus, clearFocus, userLocation, startReportAt, filters, setFilters } = useMapFocus();
  const didCenterOnUser = useRef(false);
  const [selected, setSelected] = useState<Report | null>(null);

  const rawIssues = useQuery(api.publicIssues.listForMap);
  const allReports = useMemo(
    () => (rawIssues ?? []).map(toReport),
    [rawIssues]
  );
  const [zoom, setZoom] = useState(12);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null
  );

  // ── Draggable report pin ────────────────────────────────────────
  const [reportPin, setReportPin] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [reportPinAddress, setReportPinAddress] = useState<string | null>(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);

  // Reverse geocode whenever the report pin moves
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    setReportPinAddress(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
        { headers: { "User-Agent": "SolveYVR/1.0" } }
      );
      if (res.ok) {
        const data = await res.json();
        // Build a concise address from components
        const addr = data.address || {};
        const parts = [
          addr.house_number,
          addr.road,
          addr.neighbourhood || addr.suburb,
        ].filter(Boolean);
        const short = parts.length > 0
          ? parts.join(" ")
          : data.display_name?.split(",").slice(0, 3).join(",") || null;
        setReportPinAddress(short || data.display_name || null);
      }
    } catch {
      // Silently fail — coordinates still available
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  // When the pin is set/moved, reverse geocode
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateReportPin = useCallback(
    (lat: number, lng: number) => {
      setReportPin({ lat, lng });
      // Debounce reverse geocode (300ms)
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = setTimeout(() => reverseGeocode(lat, lng), 300);
    },
    [reverseGeocode]
  );

  // Initialize report pin at user location once available
  useEffect(() => {
    if (userLocation && !reportPin) {
      updateReportPin(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, reportPin, updateReportPin]);

  // ── Existing report pins ────────────────────────────────────────

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      if (filters.area !== "all" && r.local_area !== filters.area) return false;
      if (filters.department !== "all" && r.department !== filters.department)
        return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      return true;
    });
  }, [allReports, filters]);

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

  const clusters = useMemo(() => {
    if (!bounds) return [];
    return index.getClusters(bounds, Math.floor(zoom));
  }, [index, bounds, zoom]);

  const updateView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, []);

  const onMove = useCallback(
    (_e: ViewStateChangeEvent) => {
      updateView();
    },
    [updateView]
  );

  // Auto-center on user location once
  useEffect(() => {
    if (userLocation && !didCenterOnUser.current) {
      didCenterOnUser.current = true;
      mapRef.current?.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [userLocation]);

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
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15 });
        updateReportPin(loc.lat, loc.lng);
      },
      () => {
        mapRef.current?.flyTo({
          center: [VANCOUVER_CENTER.lng, VANCOUVER_CENTER.lat],
          zoom: 12,
        });
      }
    );
  }, []);

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 20);
      mapRef.current?.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
    },
    [index]
  );

  // Click map → move report pin there
  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    updateReportPin(e.lngLat.lat, e.lngLat.lng);
    setShowReportPopup(true);
    setSelected(null);
  }, [updateReportPin]);

  // Drag report pin
  const handleReportPinDragEnd = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      updateReportPin(e.lngLat.lat, e.lngLat.lng);
    },
    [updateReportPin]
  );

  // Start report from pin — send both address and coordinates
  const handleReportFromPin = useCallback(() => {
    if (!reportPin) return;
    startReportAt({
      lat: reportPin.lat,
      lng: reportPin.lng,
      address: reportPinAddress || undefined,
    });
    setShowReportPopup(false);
  }, [reportPin, reportPinAddress, startReportAt]);

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
        onClick={handleMapClick}
      >
        <NavigationControl position="top-left" />

        {/* Existing issue pins */}
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
                  handleClusterClick(feature.id as number, lng, lat);
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
                setShowReportPopup(false);
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

        {/* Existing report popup */}
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

        {/* ── Draggable report pin ── */}
        {reportPin && (
          <Marker
            key="report-pin"
            longitude={reportPin.lng}
            latitude={reportPin.lat}
            anchor="bottom"
            draggable
            onDragEnd={handleReportPinDragEnd}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setShowReportPopup(true);
              setSelected(null);
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Pulsing ring */}
              <div className="absolute -top-1 h-10 w-10 animate-ping rounded-full bg-blue-500/20" />
              {/* Pin */}
              <svg
                className="relative z-10 cursor-grab drop-shadow-xl active:cursor-grabbing"
                width="32"
                height="42"
                viewBox="0 0 28 36"
                fill="none"
              >
                <path
                  d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z"
                  fill="#3b82f6"
                />
                <circle cx="14" cy="14" r="6" fill="white" />
                <circle cx="14" cy="14" r="3" fill="#3b82f6" />
              </svg>
            </div>
          </Marker>
        )}

        {/* Report pin popup */}
        {reportPin && showReportPopup && (
          <Marker
            longitude={reportPin.lng}
            latitude={reportPin.lat}
            anchor="bottom"
            offset={[0, -48]}
            style={{ zIndex: 20 }}
          >
            <div
              className="flex flex-col gap-1.5 rounded-lg border bg-background px-3 py-2.5 shadow-lg min-w-[180px]"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {reverseGeocoding ? (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Finding address...
                </p>
              ) : reportPinAddress ? (
                <p className="text-xs font-medium truncate max-w-[220px]">
                  📍 {reportPinAddress}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Drag pin to set location
                </p>
              )}
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  handleReportFromPin();
                }}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Report issue here
              </Button>
            </div>
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
