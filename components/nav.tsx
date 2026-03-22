"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/reports", label: "All Reports" },
  { href: "/my-reports", label: "My Reports" },
];

export function Nav({ onReportClick }: { onReportClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleReport() {
    if (onReportClick) {
      onReportClick();
    } else {
      router.push("/?report=1");
    }
  }

  return (
    <nav className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
        <MapPin className="h-5 w-5 text-primary" />
        SolveYVR
      </Link>

      <div className="flex items-center gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm transition-colors hover:text-foreground",
              pathname === link.href
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
        <Button size="sm" onClick={handleReport}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Report Issue
        </Button>
        <button className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
          Sign In
        </button>
      </div>
    </nav>
  );
}
