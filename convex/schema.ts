import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  publicIssues: defineTable({
    dedup_key: v.string(),
    source: v.literal("vancouver_open_data"),

    service_request_type: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    closure_reason: v.optional(v.string()),
    department: v.string(),
    channel: v.optional(v.string()),

    opened_at: v.number(),
    closed_at: v.optional(v.number()),
    api_updated_at: v.number(),

    address: v.optional(v.string()),
    local_area: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    has_location: v.boolean(),

    ingested_at: v.number(),
    last_refreshed_at: v.number(),
    ingest_run_id: v.optional(v.id("ingestRuns")),

    raw: v.any(),
  })
    .index("by_dedup_key", ["dedup_key"])
    .index("by_opened_at", ["opened_at"])
    .index("by_status_opened_at", ["status", "opened_at"])
    .index("by_local_area_opened_at", ["local_area", "opened_at"])
    .index("by_service_request_type_opened_at", [
      "service_request_type",
      "opened_at",
    ])
    .index("by_department_opened_at", ["department", "opened_at"])
    .index("by_has_location", ["has_location", "opened_at"]),

  ingestRuns: defineTable({
    source: v.literal("vancouver_open_data"),

    started_at: v.number(),
    finished_at: v.optional(v.number()),

    status: v.union(
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed")
    ),

    target_count: v.number(),
    records_fetched: v.number(),
    records_inserted: v.number(),
    records_updated: v.number(),
    records_unchanged: v.number(),
    records_skipped: v.number(),
    api_pages_fetched: v.number(),

    error_text: v.optional(v.string()),
  })
    .index("by_started_at", ["started_at"])
    .index("by_status", ["status"]),

  chatMessages: defineTable({
    user_id: v.string(),
    segment_id: v.string(),

    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),

    attachment_ids: v.optional(v.array(v.id("attachments"))),

    structured: v.optional(
      v.object({
        type: v.string(),
        data: v.any(),
      })
    ),

    created_at: v.number(),
  })
    .index("by_user_id_created_at", ["user_id", "created_at"])
    .index("by_segment_id", ["segment_id", "created_at"]),

  userReports: defineTable({
    user_id: v.string(),
    segment_id: v.string(),

    service_request_type: v.string(),
    department: v.optional(v.string()),
    description: v.string(),

    address: v.optional(v.string()),
    local_area: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),

    status: v.union(
      v.literal("draft"),
      v.literal("submitting"),
      v.literal("submitted"),
      v.literal("matched"),
      v.literal("resolved"),
      v.literal("failed")
    ),

    submitted_at: v.optional(v.number()),
    submission_method: v.optional(v.string()),
    reference_number: v.optional(v.string()),
    submission_error: v.optional(v.string()),

    matched_public_issue_id: v.optional(v.id("publicIssues")),
    attachment_ids: v.optional(v.array(v.id("attachments"))),

    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_id_created_at", ["user_id", "created_at"])
    .index("by_user_id_status", ["user_id", "status"])
    .index("by_segment_id", ["segment_id"]),

  attachments: defineTable({
    user_id: v.string(),
    segment_id: v.optional(v.string()),

    storage_id: v.string(),
    kind: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("file")
    ),
    mime_type: v.optional(v.string()),
    filename: v.optional(v.string()),
    size_bytes: v.optional(v.number()),

    created_at: v.number(),
  })
    .index("by_user_id", ["user_id", "created_at"])
    .index("by_segment_id", ["segment_id"]),
});
