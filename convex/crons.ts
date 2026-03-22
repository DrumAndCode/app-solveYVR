import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh 311 data",
  { hours: 4 },
  internal.ingest.sync,
  {},
);

export default crons;
