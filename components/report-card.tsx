import { type Report, formatDate, titleCase } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

export function ReportCard({ report }: { report: Report }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">
          {report.service_request_type}
        </span>
        <span className="text-xs text-muted-foreground">
          {titleCase(report.address)} &middot; {report.local_area}
        </span>
        <span className="text-xs text-muted-foreground">
          {report.department} &middot; {formatDate(report.date)}
        </span>
        {report.status === "Closed" && report.closure_reason && (
          <span className="text-xs text-emerald-600">
            Resolved: {report.closure_reason}
          </span>
        )}
      </div>
      <StatusBadge status={report.status} />
    </div>
  );
}
