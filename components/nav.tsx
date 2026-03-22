"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  HelpCircle,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
const features = [
  {
    icon: MapPin,
    title: "Report an Issue",
    description:
      "Spot a pothole, graffiti, or broken light? Let us know in 60 seconds.",
  },
  {
    icon: ClipboardList,
    title: "Browse Reports",
    description: "See what others have reported across Vancouver.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Follow your reports from submission to resolution.",
  },
];

const steps = [
  { num: "1", text: 'Tap "+ Report" above' },
  { num: "2", text: "Describe the issue via chat" },
  { num: "3", text: "We pin it on the map" },
];

export function Nav({ onReportClick }: { onReportClick?: () => void }) {
  const router = useRouter();

  function handleReport() {
    if (onReportClick) {
      onReportClick();
    } else {
      router.push("/?report=1");
    }
  }

  return (
    <nav className="flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
        <MapPin className="h-5 w-5 text-primary" />
        SolveYVR
      </Link>

      <div className="flex items-center gap-3">
        <Dialog>
          <DialogTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">How it works</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>How SolveYVR Works</DialogTitle>
              <DialogDescription>
                Report city issues in Vancouver and track them to resolution.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-muted/40 px-4 py-3">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                3 easy steps
              </p>
              <div className="flex flex-col gap-2">
                {steps.map((s) => (
                  <div key={s.num} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {s.num}
                    </span>
                    <span className="text-sm">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handleReport}>
          <Plus className="mr-1 h-3 w-3" />
          Report
        </Button>
      </div>
    </nav>
  );
}
