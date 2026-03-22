"use client";

import { useState } from "react";
import { IssueMap } from "@/components/issue-map";
import { ReportChat } from "@/components/report-chat";

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex flex-1">
      {/* Map — takes remaining space */}
      <div className={`flex flex-1 ${chatOpen ? "hidden md:flex" : ""}`}>
        <IssueMap onReportClick={() => setChatOpen(true)} />
      </div>

      {/* Chat panel — slides in from right on desktop, full-screen on mobile */}
      {chatOpen && (
        <div className="flex w-full flex-col border-l md:w-[420px] lg:w-[480px]">
          <ReportChat onClose={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  );
}
