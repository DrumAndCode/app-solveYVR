import type { Doc } from "@/convex/_generated/dataModel";

export interface Report {
  id: string;
  service_request_type: string;
  address: string;
  local_area: string;
  department: string;
  status: "Open" | "Closed";
  closure_reason?: string;
  date: string;
  close_date?: string;
  lat: number;
  lng: number;
  description?: string;
  attachments?: string[];
  ref?: string;
}

export const VANCOUVER_CENTER = { lat: 49.2827, lng: -123.1207 };

export function toReport(doc: Doc<"publicIssues">): Report {
  return {
    id: doc._id,
    service_request_type: doc.service_request_type,
    address: doc.address ?? "Unknown address",
    local_area: doc.local_area ?? "Unknown",
    department: doc.department,
    status: doc.status === "open" ? "Open" : "Closed",
    closure_reason: doc.closure_reason,
    date: doc.opened_at ? new Date(doc.opened_at).toISOString() : "",
    close_date: doc.closed_at
      ? new Date(doc.closed_at).toISOString()
      : undefined,
    lat: doc.latitude ?? 0,
    lng: doc.longitude ?? 0,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
