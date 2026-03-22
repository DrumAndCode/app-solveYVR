"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map } from "lucide-react";
import { Nav } from "@/components/nav";
import { IssueMap } from "@/components/issue-map";
import { MapProvider, useMapFocus } from "@/lib/map-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/reports", label: "All Reports" },
  { href: "/my-reports", label: "My Reports" },
];

/** Navigate to home when a report location is set from the map pin */
function ReportLocationRouter({ onReport }: { onReport?: () => void }) {
  const { reportLocation } = useMapFocus();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (reportLocation) {
      onReport?.();
      if (pathname !== "/") {
        router.push("/");
      }
    }
  }, [reportLocation, pathname, router, onReport]);

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showMap, setShowMap] = useState(false);

  return (
    <MapProvider>
    <ReportLocationRouter onReport={() => setShowMap(false)} />
    <div className="relative flex h-full flex-1">
      {/* Full-bleed map — hidden on mobile unless toggled, always visible on md+ */}
      <div className={cn(
        "absolute inset-0 z-0",
        showMap ? "block" : "hidden md:block"
      )}>
        <IssueMap />
      </div>

      {/* Mobile map toggle button */}
      {showMap && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center md:hidden">
          <Button
            size="sm"
            className="shadow-lg"
            onClick={() => setShowMap(false)}
          >
            Close Map
          </Button>
        </div>
      )}

      {/* Floating right pane — full-width on mobile, fixed-width sidebar on md+ */}
      <div className={cn(
        "relative z-10 flex flex-col overflow-hidden bg-background",
        // Mobile: full screen
        "h-full w-full",
        // md+: floating card on the right
        "md:m-6 md:ml-auto md:h-[calc(100%-3rem)] md:w-[420px] md:shrink-0 md:rounded-2xl md:shadow-md lg:w-[480px]",
        // Hide panel when mobile map is open
        showMap && "hidden md:flex"
      )}>
        <Nav />
        <div className="flex shrink-0 items-center border-b px-4">
          <div className="flex flex-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative px-3 py-2.5 text-sm transition-colors hover:text-foreground",
                  (pathname === tab.href || (tab.href === "/reports" && pathname === "/"))
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
                {(pathname === tab.href || (tab.href === "/reports" && pathname === "/")) && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>
          {/* Mobile-only map toggle */}
          <button
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setShowMap(true)}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
    </MapProvider>
  );
}
