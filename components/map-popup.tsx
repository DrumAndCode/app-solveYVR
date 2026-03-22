import { type Report, formatDate, titleCase } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

export function MapPopup({ report }: { report: Report }) {
  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold leading-tight">
          {report.service_request_type}
        </span>
        <StatusBadge status={report.status} />
      </div>
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
  );
}
