"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReportChat } from "@/components/report-chat";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ClipboardList,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react";
import { mockReports } from "@/lib/mock-data";

const features = [
  {
    icon: MapPin,
    title: "Report an Issue",
    description:
      "Spot a pothole, graffiti, or broken light? Let us know in 60 seconds.",
    href: "/?report=1",
  },
  {
    icon: ClipboardList,
    title: "Browse Reports",
    description: "See what others have reported across Vancouver.",
    href: "/reports",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Follow your reports from submission to resolution.",
    href: "/my-reports",
  },
];

const steps = [
  { num: "1", text: 'Tap "+ Report" above' },
  { num: "2", text: "Describe the issue via chat" },
  { num: "3", text: "We pin it on the map" },
];

function HomeContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

  if (chatOpen) {
    return (
      <div className="flex flex-1 flex-col">
        <ReportChat onClose={() => setChatOpen(false)} />
      </div>
    );
  }

  const openCount = mockReports.filter((r) => r.status === "Open").length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Hero */}
      <div className="flex flex-col items-center gap-1 px-6 pt-10 pb-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome to SolveYVR
        </h2>
        <p className="text-base text-muted-foreground">
          Your voice for a better city.
        </p>
      </div>

      {/* Feature cards */}
      <div className="flex flex-col gap-2 px-5">
        {features.map((f) => (
          <button
            key={f.title}
            onClick={() => {
              if (f.href === "/?report=1") {
                setChatOpen(true);
              } else {
                router.push(f.href);
              }
            }}
            className="group flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <f.icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">{f.title}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-0.5 text-base text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* How it works */}
      <div className="mx-5 mt-6 rounded-lg bg-muted/40 px-4 py-4">
        <p className="mb-3 text-base font-medium tracking-wide text-muted-foreground uppercase">
          How it works
        </p>
        <div className="flex flex-col gap-2.5">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                {s.num}
              </span>
              <span className="text-base">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-8">
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => setChatOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Report Your First Issue
        </Button>
        <p className="text-base text-muted-foreground">
          {openCount} open issues across Vancouver right now
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
