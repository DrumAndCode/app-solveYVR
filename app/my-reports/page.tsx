"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { myReports, formatDate } from "@/lib/mock-data";

export default function MyReportsPage() {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      <h1 className="text-lg font-semibold">
        My Reports ({myReports.length})
      </h1>

      <div className="flex flex-col gap-2">
        {myReports.map((report) => (
          <Link
            key={report.id}
            href={`/my-reports/${report.id}`}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {report.service_request_type}
                </span>
                <StatusBadge status={report.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {report.address} &middot; {report.local_area}
              </span>
              <span className="text-xs text-muted-foreground">
                {report.department} &middot; Submitted {formatDate(report.date)}
                {report.close_date &&
                  ` · Resolved ${formatDate(report.close_date)}`}
              </span>
              <span className="text-xs text-muted-foreground">
                Ref: #{report.ref}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {myReports.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No reports yet. Go to the map to report an issue.
        </div>
      )}
    </div>
  );
}
