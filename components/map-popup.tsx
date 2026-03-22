import { X } from "lucide-react";
import { type Report, formatDate, titleCase } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MapPopup({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  return (
    <Card size="sm" className="w-64 shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm font-semibold leading-tight">
          {report.service_request_type}
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="-mt-2 flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          {titleCase(report.address)} &middot; {report.local_area}
        </p>
        <p className="text-xs text-muted-foreground">
          {report.department} &middot; {formatDate(report.date)} &middot;{" "}
          <StatusBadge status={report.status} />
        </p>
        {report.status === "Closed" && report.closure_reason && (
          <p className="text-xs text-emerald-600">
            Resolved: {report.closure_reason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
