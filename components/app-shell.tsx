"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { IssueMap } from "@/components/issue-map";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/reports", label: "All Reports" },
  { href: "/my-reports", label: "My Reports" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex h-full flex-1">
      {/* Full-bleed map behind everything */}
      <div className="absolute inset-0">
        <IssueMap />
      </div>

      {/* Floating left pane */}
      <div className="relative z-10 m-6 flex w-[420px] shrink-0 flex-col overflow-hidden rounded-2xl bg-background shadow-md lg:w-[480px]">
        <Nav />
        <div className="flex shrink-0 border-b px-4">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative px-3 py-2.5 text-sm transition-colors hover:text-foreground",
                pathname === tab.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
              {pathname === tab.href && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
