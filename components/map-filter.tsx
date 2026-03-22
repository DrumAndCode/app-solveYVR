"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEIGHBOURHOODS, DEPARTMENTS } from "@/lib/mock-data";

export interface Filters {
  area: string;
  department: string;
  status: string;
}

const EMPTY: Filters = { area: "all", department: "all", status: "all" };

export function MapFilter({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false);

  const hasFilters =
    filters.area !== "all" ||
    filters.department !== "all" ||
    filters.status !== "all";

  return (
    <>
      <Button
        size="sm"
        variant={hasFilters ? "default" : "secondary"}
        className="shadow-md"
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
        Filter
        {hasFilters && (
          <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-base">
            {[filters.area, filters.department, filters.status].filter(
              (v) => v !== "all"
            ).length}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute bottom-12 left-0 z-10 w-72 rounded-lg border bg-background p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-medium">Filters</span>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-base text-muted-foreground">
                Neighbourhood
              </label>
              <Select
                value={filters.area}
                onValueChange={(v) => onChange({ ...filters, area: v ?? "all" })}
              >
                <SelectTrigger className="h-8 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {NEIGHBOURHOODS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-base text-muted-foreground">
                Department
              </label>
              <Select
                value={filters.department}
                onValueChange={(v) => onChange({ ...filters, department: v ?? "all" })}
              >
                <SelectTrigger className="h-8 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-base text-muted-foreground">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(v) => onChange({ ...filters, status: v ?? "all" })}
              >
                <SelectTrigger className="h-8 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="text-base"
                onClick={() => onChange(EMPTY)}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
