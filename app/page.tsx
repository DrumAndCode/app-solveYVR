"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReportChat } from "@/components/report-chat";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { mockReports } from "@/lib/mock-data";

function HomeContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

  if (chatOpen) {
    return (
      <div className="flex flex-1 flex-col">
        <ReportChat onClose={() => setChatOpen(false)} />
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
