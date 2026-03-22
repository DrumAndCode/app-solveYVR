"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, ArrowUpDown, ChevronDown } from "lucide-react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/report-card";
import { toReport } from "@/lib/mock-data";
import { useMapFocus } from "@/lib/map-context";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
] as const;

export default function ReportsPage() {
  const { filters, setFilters } = useMapFocus();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showAreas, setShowAreas] = useState(false);
  const [showDepts, setShowDepts] = useState(false);

  const stats = useQuery(api.publicIssues.stats);
  const neighbourhoods = stats?.localAreas ?? [];
  const departments = stats?.departments ?? [];

  const convexStatus =
    filters.status === "all"
      ? undefined
      : filters.status === "Open"
        ? ("open" as const)
        : ("closed" as const);

  const { results, status: paginationStatus, loadMore } = usePaginatedQuery(
    api.publicIssues.list,
    {
      status: convexStatus,
      local_area: filters.area !== "all" ? filters.area : undefined,
      department: filters.department !== "all" ? filters.department : undefined,
    },
    { initialNumItems: 20 }
  );

  const activeFilterCount =
    [filters.area, filters.department, filters.status].filter(
      (v) => v !== "all"
    ).length + (search ? 1 : 0);

  const clearAll = useCallback(() => {
    setFilters({ area: "all", department: "all", status: "all" });
    setSearch("");
  }, [setFilters]);

  const filtered = useMemo(() => {
    let reports = (results ?? []).map(toReport);
    if (search) {
      const q = search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.address.toLowerCase().includes(q) ||
          r.service_request_type.toLowerCase().includes(q)
      );
    }
    reports.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return reports;
  }, [results, search, sort]);

  const isLoading = results === undefined;

  return (
    <div className="flex w-full flex-col gap-3 px-4 py-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by address or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilters({ ...filters, status: opt.value })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.status === opt.value
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Area picker */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => { setShowAreas(!showAreas); setShowDepts(false); }}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
        >
          <span className={filters.area === "all" ? "text-muted-foreground" : "font-medium"}>
            {filters.area === "all" ? "All areas" : filters.area}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showAreas ? "rotate-180" : ""}`} />
        </button>
        {showAreas && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/20 p-2.5">
            <button
              onClick={() => { setFilters({ ...filters, area: "all" }); setShowAreas(false); }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.area === "all"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              All areas
            </button>
            {neighbourhoods.map((n) => (
              <button
                key={n}
                onClick={() => { setFilters({ ...filters, area: n }); setShowAreas(false); }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.area === n
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Department picker */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => { setShowDepts(!showDepts); setShowAreas(false); }}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
        >
          <span className={filters.department === "all" ? "text-muted-foreground" : "font-medium"}>
            {filters.department === "all" ? "All departments" : filters.department}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showDepts ? "rotate-180" : ""}`} />
        </button>
        {showDepts && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/20 p-2.5">
            <button
              onClick={() => { setFilters({ ...filters, department: "all" }); setShowDepts(false); }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.department === "all"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              All departments
            </button>
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => { setFilters({ ...filters, department: d }); setShowDepts(false); }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.department === d
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort + results count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `${filtered.length} report${filtered.length !== 1 ? "s" : ""}`}
        </span>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sort === "newest" ? "Newest first" : "Oldest first"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border bg-muted/30"
              />
            ))
          : filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

        {paginationStatus === "CanLoadMore" && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 self-center"
            onClick={() => loadMore(20)}
          >
            Load more
          </Button>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No reports match your filters.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-3 text-center text-xs text-muted-foreground">
        Data from Vancouver Open Data &middot; Auto-refreshed every 4 hours
      </div>
    </div>
  );
}
