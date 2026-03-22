"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReportChat } from "@/components/report-chat";
import { useMapFocus, type LocationInfo } from "@/lib/map-context";
import ReportsPage from "@/app/reports/page";

function HomeContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLocation, setChatLocation] = useState<LocationInfo | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const searchParams = useSearchParams();
  const { reportLocation, clearReportLocation } = useMapFocus();

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (reportLocation) {
      setChatLocation(reportLocation);
      setChatKey((k) => k + 1);
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

  return <ReportsPage />;
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
