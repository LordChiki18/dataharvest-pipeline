import { Router } from "express";
import { pending, raw, processed } from "../../queue/queues";
import { db } from "../../db/client";
import { logger } from "../../logger";

export const metricsRouter = Router();

metricsRouter.get("/", async (req, res) => {
  try {
    const [pendingCount, rawCount, processedCount] = await Promise.all([
      pending.getJobCounts(),
      raw.getJobCounts(),
      processed.getJobCounts(),
    ]);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const completedJobs = await db("scrape_jobs")
      .where("status", "done")
      .where("completed_at", ">=", oneHourAgo)
      .count("* as count")
      .first();

    const failedJobs = await db("scrape_jobs")
      .where("status", "failed")
      .where("triggered_at", ">=", oneHourAgo)
      .count("* as count")
      .first();

    res.json({
      queues: {
        pending: pendingCount,
        raw: rawCount,
        processed: processedCount,
      },
      lastHour: {
        completed: completedJobs?.count ?? 0,
        failed: failedJobs?.count ?? 0,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error fetching metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});
