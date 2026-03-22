import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attachments", {
      user_id: args.user_id,
      segment_id: args.segment_id,
      storage_id: args.storage_id,
      kind: args.kind,
      mime_type: args.mime_type,
      filename: args.filename,
      size_bytes: args.size_bytes,
      created_at: Date.now(),
    });
  },
});

export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};
    for (const id of args.storageIds) {
      urls[id] = await ctx.storage.getUrl(id);
    }
    return urls;
  },
});

export const get = query({
  args: { id: v.id("attachments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listBySegment = query({
  args: { segment_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attachments")
      .withIndex("by_segment_id", (q) => q.eq("segment_id", args.segment_id))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("attachments") },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.id);
    if (attachment) {
      await ctx.storage.delete(attachment.storage_id);
      await ctx.db.delete(args.id);
    }
  },
});
