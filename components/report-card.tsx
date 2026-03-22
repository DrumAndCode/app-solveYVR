import { type Report, formatDate, titleCase } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { useMapFocus } from "@/lib/map-context";

export function ReportCard({ report }: { report: Report }) {
  const { focusReport } = useMapFocus();

  return (
    <div
      className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
      onClick={() => focusReport(report)}
    >
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">
          {report.service_request_type}
        </span>
        <span className="text-base text-muted-foreground">
          {titleCase(report.address)} &middot; {report.local_area}
        </span>
        <span className="text-base text-muted-foreground">
          {report.department} &middot; {formatDate(report.date)}
        </span>
        {report.status === "Closed" && report.closure_reason && (
          <span className="text-base text-emerald-600">
            Resolved: {report.closure_reason}
          </span>
        )}
      </div>
      <StatusBadge status={report.status} />
    </div>
  );
}
