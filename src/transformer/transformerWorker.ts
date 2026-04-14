import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { processed } from "../queue/queues";
import { logger } from "../logger";
import { jobPayloadSchema } from "../queue/jobSchema";

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const transformerWorker = new Worker(
  "scrape-raw",
  async (job: Job) => {
    const parsed = jobPayloadSchema.safeParse(job.data);
    if (!parsed.success) {
      logger.error(
        { errors: parsed.error?.issues, jobId: job.data.jobId },
        "Invalid job payload",
      );
      throw new Error("Invalid job payload");
    }
    const { source, jobId, payload } = job.data;
    logger.info({ jobId, source }, "Transformer processing job");

    await processed.add(
      "processed-data",
      {
        jobId,
        source,
        createdAt: new Date().toISOString(),
        payload,
        attempt: job.attemptsMade,
      },
      {
        attempts: 2,
        backoff: { type: "fixed", delay: 5000 },
      },
    );

    logger.info(
      { jobId, source },
      "Transformer done, pushed to PROCESSED queue",
    );
  },
  {
    connection,
    concurrency: parseInt(process.env.TRANSFORMER_CONCURRENCY ?? "5"),
  },
);
