"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyReportsPage() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">No reports yet</h2>
      <p className="text-sm text-muted-foreground max-w-[260px]">
        Reports you submit through the chat will appear here.
      </p>
      <Button asChild size="sm">
        <Link href="/">Report a new issue</Link>
      </Button>
    </div>
  );
}
