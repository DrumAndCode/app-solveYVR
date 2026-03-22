import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: "Open" | "Closed" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-base font-medium",
        status === "Open"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-emerald-300 bg-emerald-50 text-emerald-700"
      )}
    >
      {status === "Open" ? (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
      ) : (
        <span className="text-emerald-600">&#10003;</span>
      )}
      {status === "Open" ? "Open" : "Closed"}
    </Badge>
  );
}
