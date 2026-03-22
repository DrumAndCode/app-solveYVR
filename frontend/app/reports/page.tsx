"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
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
import {
  mockReports,
  NEIGHBOURHOODS,
  DEPARTMENTS,
} from "@/lib/mock-data";

const PAGE_SIZE = 8;

export default function ReportsPage() {
  const [area, setArea] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let results = mockReports.filter((r) => {
      if (area !== "all" && r.local_area !== area) return false;
      if (department !== "all" && r.department !== department) return false;
      if (status !== "all" && r.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesAddress = r.address.toLowerCase().includes(q);
        const matchesType = r.service_request_type.toLowerCase().includes(q);
        if (!matchesAddress && !matchesType) return false;
      }
      return true;
    });

    results.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return results;
  }, [area, department, status, search, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
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
        <div className="flex flex-wrap gap-2">
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="Area" />
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

          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue placeholder="Department" />
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

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
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
        <span className="text-xs text-muted-foreground">
          {filtered.length} report{filtered.length !== 1 && "s"}
        </span>
        <div className="flex flex-col gap-2">
          {visible.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            className="mt-4 self-center"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Load more
          </Button>
        )}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No reports match your filters.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-xs text-muted-foreground">
        Data from Vancouver Open Data &middot; Updated monthly
      </div>
    </div>
  );
}
