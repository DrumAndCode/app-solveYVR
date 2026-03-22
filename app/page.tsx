"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReportChat } from "@/components/report-chat";

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

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">Welcome to SolveYVR</h2>
      <p className="text-sm text-muted-foreground">
        Report city issues in Vancouver. Click &ldquo;Report Issue&rdquo; to get started, or browse existing reports.
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
