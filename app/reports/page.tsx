"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/report-card";
import { toReport } from "@/lib/mock-data";
import { useMapFocus } from "@/lib/map-context";

export default function ReportsPage() {
  const { filters, setFilters } = useMapFocus();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

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
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by address or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select
            value={filters.area}
            onValueChange={(v) => setFilters({ ...filters, area: v ?? "all" })}
          >
            <SelectTrigger className="h-8 min-w-0 text-base sm:w-[180px]">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {neighbourhoods.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.department}
            onValueChange={(v) =>
              setFilters({ ...filters, department: v ?? "all" })
            }
          >
            <SelectTrigger className="h-8 min-w-0 text-base sm:w-[220px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) =>
              setFilters({ ...filters, status: v ?? "all" })
            }
          >
            <SelectTrigger className="h-8 min-w-0 text-base sm:w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v ?? "newest")}>
            <SelectTrigger className="h-8 min-w-0 text-base sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1">
        <span className="text-base text-muted-foreground">
          {isLoading ? "Loading..." : `${filtered.length} report${filtered.length !== 1 ? "s" : ""}`}
        </span>
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
        </div>

        {paginationStatus === "CanLoadMore" && (
          <Button
            variant="outline"
            className="mt-4 self-center"
            onClick={() => loadMore(20)}
          >
            Load more
          </Button>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-base text-muted-foreground">
            No reports match your filters.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-base text-muted-foreground">
        Data from Vancouver Open Data &middot; Auto-refreshed every 4 hours
      </div>
    </div>
  );
}
