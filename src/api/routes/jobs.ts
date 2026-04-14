import { Router } from "express";
import { pending } from "../../queue/queues";
import { db } from "../../db/client";
import { logger } from "../../logger";
import { v4 as uuidv4 } from "uuid";
import { dlqQueue } from "../../queue/dlq";

export const jobsRouter = Router();

// Trigger a scrape job manually
jobsRouter.post("/trigger", async (req, res) => {
  try {
    const { source } = req.body;
    if (!["books", "hackernews"].includes(source)) {
      res
        .status(400)
        .json({ error: "Invalid source. Must be 'books' or 'hackernews'." });
      return;
    }

    const jobId = uuidv4();
    const priority = source === "hackernews" ? 1 : 2;

    await pending.add(
      `scrape-${source}`,
      {
        jobId,
        source,
        createdAt: new Date().toISOString(),
        attempt: 0,
      },
      { priority: priority },
    );

    await db("scrape_jobs").insert({
      id: jobId,
      source,
      status: "pending",
    });

    logger.info({ jobId, source }, "Manual scrape job triggered");
    res.status(201).json({ jobId, source, status: "pending" });
  } catch (error) {
    logger.error({ error }, "Error fetching jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List all jobs
jobsRouter.get("/", async (req, res) => {
  try {
    const { status, source, limit = 20, offset = 0 } = req.query;

    const query = db("scrape_jobs").orderBy("triggered_at", "desc");
    if (status) query.where("status", status);
    if (source) query.where("source", source);
    query.limit(Number(limit)).offset(Number(offset));

    const jobs = await query;
    res.json(jobs);
  } catch (error) {
    logger.error({ error }, "Error fetching jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get DLQ contents
jobsRouter.get("/dlq", async (req, res) => {
  try {
    const jobs = await dlqQueue.getJobs(["failed"], 0, 49);
    const result = jobs.map((job) => ({
      jobId: job.id,
      source: job.data.source,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      data: job.data,
    }));
    res.json({ result });
  } catch (error) {
    logger.error({ error }, "Error fetching jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single job
jobsRouter.get("/:id", async (req, res) => {
  try {
    const job = await db("scrape_jobs").where("id", req.params.id).first();
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  } catch (error) {
    logger.error({ error }, "Error fetching jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a DLQ job
jobsRouter.delete("/dlq/:id", async (req, res) => {
  try {
    const job = await dlqQueue.getJob(req.params.id);
    if (!job) {
      res.status(404).json({ error: "Job not found in DLQ" });
      return;
    }

    await job.remove();
    res.json({ message: "Job remove from DLQ" });
  } catch (error) {
    logger.error({ error }, "Error fetching jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Retry a DLQ job
jobsRouter.post("/dlq/:jobId/retry", async (req, res) => {
  try {
    const job = await dlqQueue.getJob(req.params.jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found in DLQ" });
      return;
    }

    await job.retry();
    res.json({ message: "Job requeued for retry" });
  } catch (error) {
    logger.error({ error }, "Error fetching jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});
