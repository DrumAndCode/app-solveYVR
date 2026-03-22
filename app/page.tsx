"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReportChat } from "@/components/report-chat";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { mockReports } from "@/lib/mock-data";
import { useMapFocus, type LocationInfo } from "@/lib/map-context";

function HomeContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLocation, setChatLocation] = useState<LocationInfo | null>(null);
  const searchParams = useSearchParams();
  const { reportLocation, clearReportLocation } = useMapFocus();

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

  // When a pin's "Report an issue here" is clicked, open chat with that location
  useEffect(() => {
    if (reportLocation) {
      setChatLocation(reportLocation);
      setChatOpen(true);
      clearReportLocation();
    }
  }, [reportLocation, clearReportLocation]);

  if (chatOpen) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <ReportChat
          onClose={() => {
            setChatOpen(false);
            setChatLocation(null);
          }}
          initialLocation={chatLocation}
        />
      </div>
    );
  }

  const openCount = mockReports.filter((r) => r.status === "Open").length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
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
      <Button
        size="lg"
        className="mt-2 gap-2"
        onClick={() => setChatOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Report Your First Issue
      </Button>
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
