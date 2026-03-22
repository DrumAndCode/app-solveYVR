"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/nav";
import { IssueMap } from "@/components/issue-map";
import { ReportChat } from "@/components/report-chat";

function HomeContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

  return (
    <>
      <Nav onReportClick={() => setChatOpen(true)} />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1">
          <div className={`flex flex-1 ${chatOpen ? "hidden md:flex" : ""}`}>
            <IssueMap />
          </div>

          {chatOpen && (
            <div className="flex w-full flex-col border-l md:w-[420px] lg:w-[480px]">
              <ReportChat onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
