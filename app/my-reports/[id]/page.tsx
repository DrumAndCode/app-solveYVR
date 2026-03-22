"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Play } from "lucide-react";
import { Nav } from "@/components/nav";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { myReports, formatDateLong, formatDate, titleCase } from "@/lib/mock-data";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const report = myReports.find((r) => r.id === id);

  if (!report) {
    return (
      <>
      <Nav />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <Link
          href="/my-reports"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Reports
        </Link>
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </div>
      </>
    );
  }

  const timelineEvents = [
    {
      date: formatDate(report.date),
      label: "Submitted via SolveYVR",
      detail: "Email sent to 311@vancouver.ca",
      completed: true,
    },
    {
      date: formatDate(report.date),
      label: "Matched in Van311 system",
      detail: "Service request received by city",
      completed: true,
    },
    ...(report.close_date
      ? [
          {
            date: formatDate(report.close_date),
            label: "Resolved",
            detail: report.closure_reason ?? "Service provided",
            completed: true,
          },
        ]
      : [
          {
            date: "...",
            label: "Awaiting resolution",
            completed: false,
          },
        ]),
  ];

  return (
    <>
    <Nav />
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <Link
        href="/my-reports"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Reports
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">
            {report.service_request_type}
          </h1>
          <p className="text-xs text-muted-foreground">Ref: #{report.ref}</p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <Separator />

      {/* Details */}
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">Location</span>
        <span>
          {titleCase(report.address)}, {report.local_area}
        </span>

        <span className="text-muted-foreground">Department</span>
        <span>{report.department}</span>

        <span className="text-muted-foreground">Submitted</span>
        <span>{formatDateLong(report.date)}</span>

        <span className="text-muted-foreground">Channel</span>
        <span>SolveYVR (Email)</span>
      </div>

      <Separator />

      {/* Description */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Description</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {report.description ?? "No description provided."}
        </p>
      </div>

      <Separator />

      {/* Attachments */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Attachments</h2>
        <div className="flex gap-3">
          {/* Placeholder photos */}
          <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          {/* Placeholder voice note */}
          <div className="flex h-20 w-40 flex-col items-start justify-center gap-1 rounded-md bg-muted px-3">
            <span className="text-xs text-muted-foreground">Voice note</span>
            <div className="flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="h-1 flex-1 rounded-full bg-muted-foreground/20">
                <div className="h-1 w-1/3 rounded-full bg-muted-foreground/50" />
              </div>
              <span className="text-[10px] text-muted-foreground">0:12</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Status Timeline</h2>
        <StatusTimeline events={timelineEvents} />
      </div>
    </div>
    </>
  );
}
