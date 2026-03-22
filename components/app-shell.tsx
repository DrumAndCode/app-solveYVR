"use client";

import { Nav } from "@/components/nav";
import { IssueMap } from "@/components/issue-map";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-1">
      {/* Left pane: nav + page content */}
      <div className="flex w-[420px] shrink-0 flex-col border-r lg:w-[480px]">
        <Nav />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>

      {/* Right pane: always the map */}
      <div className="relative flex-1">
        <IssueMap />
      </div>
    </div>
  );
}
