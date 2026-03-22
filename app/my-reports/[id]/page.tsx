"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReportDetailPage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <Link
        href="/my-reports"
        className="flex items-center gap-1 text-base text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Reports
      </Link>
      <p className="text-base text-muted-foreground">Report not found.</p>
    </div>
  );
}
