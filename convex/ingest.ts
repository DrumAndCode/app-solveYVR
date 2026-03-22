import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const API_BASE =
  "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/3-1-1-service-requests/records";
const PAGE_SIZE = 100;
const BATCH_SIZE = 50;
const DEFAULT_TARGET = 2000;

interface VancouverApiRecord {
  department: string;
  service_request_type: string;
  status: string;
  closure_reason: string | null;
  service_request_open_timestamp: string | null;
  service_request_close_date: string | null;
  last_modified_timestamp: string | null;
  address: string | null;
  local_area: string | null;
  channel: string | null;
  latitude: number | null;
  longitude: number | null;
  geom: { lon: number; lat: number } | null;
}

interface ApiResponse {
  total_count: number;
  results: VancouverApiRecord[];
}

function buildDedupKey(r: VancouverApiRecord): string {
  return [
    r.service_request_type,
    r.service_request_open_timestamp ?? "",
    r.address ?? "",
    String(r.latitude ?? ""),
    String(r.longitude ?? ""),
  ].join("|");
}

function normalizeRecord(raw: VancouverApiRecord) {
  const openedAtMs = raw.service_request_open_timestamp
    ? Date.parse(raw.service_request_open_timestamp)
    : 0;
  const closedAtMs = raw.service_request_close_date
    ? Date.parse(raw.service_request_close_date)
    : undefined;
  const apiUpdatedAtMs = raw.last_modified_timestamp
    ? Date.parse(raw.last_modified_timestamp)
    : openedAtMs;

  const hasLat = raw.latitude !== null && raw.latitude !== undefined;
  const hasLng = raw.longitude !== null && raw.longitude !== undefined;

  const closureReason =
    raw.closure_reason && raw.closure_reason !== "N/A"
      ? raw.closure_reason
      : undefined;

  return {
    dedup_key: buildDedupKey(raw),
    source: "vancouver_open_data" as const,
    service_request_type: raw.service_request_type,
    status: (raw.status === "Open" ? "open" : "closed") as "open" | "closed",
    closure_reason: closureReason,
    department: raw.department,
    channel: raw.channel ?? undefined,
    opened_at: openedAtMs,
    closed_at: closedAtMs,
    api_updated_at: apiUpdatedAtMs,
    address: raw.address ?? undefined,
    local_area: raw.local_area ?? undefined,
    latitude: hasLat ? raw.latitude! : undefined,
    longitude: hasLng ? raw.longitude! : undefined,
    has_location: hasLat && hasLng,
    raw,
  };
}

async function fetchPage(
  offset: number,
  limit: number
): Promise<ApiResponse> {
  const url = `${API_BASE}?limit=${limit}&offset=${offset}&order_by=service_request_open_timestamp+desc`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Vancouver API returned ${response.status}: ${await response.text()}`
    );
  }
  return response.json();
}

export const sync = action({
  args: {
    targetCount: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<string> => {
    const targetCount = args.targetCount ?? DEFAULT_TARGET;
    const now = Date.now();

    const runId: Id<"ingestRuns"> = await ctx.runMutation(
      internal.ingest.createRun,
      { targetCount, now }
    );

    let totalFetched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalUnchanged = 0;
    let totalSkipped = 0;
    let pagesFetched = 0;

    try {
      const pagesNeeded = Math.ceil(targetCount / PAGE_SIZE);

      for (let page = 0; page < pagesNeeded; page++) {
        const offset = page * PAGE_SIZE;
        const limit = Math.min(PAGE_SIZE, targetCount - totalFetched);

        const data = await fetchPage(offset, limit);
        pagesFetched++;
        totalFetched += data.results.length;

        const normalized = data.results
          .filter(
            (r) => r.service_request_type && r.department && r.service_request_open_timestamp
          )
          .map(normalizeRecord);

        const skippedThisPage = data.results.length - normalized.length;
        totalSkipped += skippedThisPage;

        for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
          const batch = normalized.slice(i, i + BATCH_SIZE);
          const result = await ctx.runMutation(
            internal.ingest.processBatch,
            {
              records: batch,
              ingestRunId: runId,
              now,
            }
          );
          totalInserted += result.inserted;
          totalUpdated += result.updated;
          totalUnchanged += result.unchanged;
        }

        if (data.results.length < limit) break;
      }

      await ctx.runMutation(internal.ingest.finalizeRun, {
        runId,
        status: "succeeded",
        recordsFetched: totalFetched,
        recordsInserted: totalInserted,
        recordsUpdated: totalUpdated,
        recordsUnchanged: totalUnchanged,
        recordsSkipped: totalSkipped,
        apiPagesFetched: pagesFetched,
        now: Date.now(),
      });

      return `Ingestion succeeded: ${totalFetched} fetched, ${totalInserted} inserted, ${totalUpdated} updated, ${totalUnchanged} unchanged, ${totalSkipped} skipped across ${pagesFetched} pages.`;
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.ingest.finalizeRun, {
        runId,
        status: "failed",
        recordsFetched: totalFetched,
        recordsInserted: totalInserted,
        recordsUpdated: totalUpdated,
        recordsUnchanged: totalUnchanged,
        recordsSkipped: totalSkipped,
        apiPagesFetched: pagesFetched,
        errorText,
        now: Date.now(),
      });
      throw new Error(`Ingestion failed: ${errorText}`);
    }
  },
});

export const createRun = internalMutation({
  args: {
    targetCount: v.number(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ingestRuns", {
      source: "vancouver_open_data",
      started_at: args.now,
      status: "running",
      target_count: args.targetCount,
      records_fetched: 0,
      records_inserted: 0,
      records_updated: 0,
      records_unchanged: 0,
      records_skipped: 0,
      api_pages_fetched: 0,
    });
  },
});

export const processBatch = internalMutation({
  args: {
    records: v.array(v.any()),
    ingestRunId: v.id("ingestRuns"),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const record of args.records) {
      const existing = await ctx.db
        .query("publicIssues")
        .withIndex("by_dedup_key", (q) => q.eq("dedup_key", record.dedup_key))
        .first();

      if (!existing) {
        await ctx.db.insert("publicIssues", {
          ...record,
          ingested_at: args.now,
          last_refreshed_at: args.now,
          ingest_run_id: args.ingestRunId,
        });
        inserted++;
      } else {
        const changed =
          existing.status !== record.status ||
          existing.closure_reason !== record.closure_reason ||
          existing.closed_at !== record.closed_at ||
          existing.api_updated_at !== record.api_updated_at;

        if (changed) {
          await ctx.db.patch(existing._id, {
            status: record.status,
            closure_reason: record.closure_reason,
            closed_at: record.closed_at,
            api_updated_at: record.api_updated_at,
            last_refreshed_at: args.now,
            ingest_run_id: args.ingestRunId,
            raw: record.raw,
          });
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    return { inserted, updated, unchanged };
  },
});

export const finalizeRun = internalMutation({
  args: {
    runId: v.id("ingestRuns"),
    status: v.union(v.literal("succeeded"), v.literal("failed")),
    recordsFetched: v.number(),
    recordsInserted: v.number(),
    recordsUpdated: v.number(),
    recordsUnchanged: v.number(),
    recordsSkipped: v.number(),
    apiPagesFetched: v.number(),
    errorText: v.optional(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      finished_at: args.now,
      records_fetched: args.recordsFetched,
      records_inserted: args.recordsInserted,
      records_updated: args.recordsUpdated,
      records_unchanged: args.recordsUnchanged,
      records_skipped: args.recordsSkipped,
      api_pages_fetched: args.apiPagesFetched,
      error_text: args.errorText,
    });
  },
});
