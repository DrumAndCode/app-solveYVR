"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReportChat } from "@/components/report-chat";
import { MapPin } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMapFocus, type LocationInfo } from "@/lib/map-context";

function HomeContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLocation, setChatLocation] = useState<LocationInfo | null>(null);
  // Key forces ReportChat to remount (fresh agent) when location changes
  const [chatKey, setChatKey] = useState(0);
  const searchParams = useSearchParams();
  const { reportLocation, clearReportLocation } = useMapFocus();

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

  // When a pin's "Report an issue here" is clicked, open/restart chat with that location
  useEffect(() => {
    if (reportLocation) {
      setChatLocation(reportLocation);
      setChatKey((k) => k + 1); // force remount → fresh agent session
      setChatOpen(true);
      clearReportLocation();
    }
  }, [reportLocation, clearReportLocation]);

  if (chatOpen) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <ReportChat
          key={chatKey}
          onClose={() => {
            setChatOpen(false);
            setChatLocation(null);
          }}
          initialLocation={chatLocation}
        />
      </div>
    );
  }

  const stats = useQuery(api.publicIssues.stats);
  const openCount = stats?.open ?? 0;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <MapPin className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome to SolveYVR
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          Your voice for a better city.
        </p>
      </div>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        Tap the blue pin on the map to report an issue at that location.
      </p>
      <p className="text-xs text-muted-foreground">
        {openCount} open issues across Vancouver right now
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
