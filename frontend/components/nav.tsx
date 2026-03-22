"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/reports", label: "All Reports" },
  { href: "/my-reports", label: "My Reports" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
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
        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Sign In
        </button>
      </div>
    </nav>
  );
}
