import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { scrapeBooks } from "./scrapers/booksScraper";
import { scrapeHN } from "./scrapers/hnScraper";
import { raw } from "../queue/queues";
import { logger } from "../logger";
import { v4 as uuidv4 } from "uuid";

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const scraperWorker = new Worker(
  "scrape-pending",
  async (job: Job) => {
    const { source, jobId } = job.data;
    logger.info({ jobId, source }, "Scraper worker processing job");

    let results;
    if (source === "books") {
      results = await scrapeBooks();
    } else if (source === "hackernews") {
      results = await scrapeHN();
    } else {
      throw new Error(`Unknown source: ${source}`);
    }

    await raw.add("raw-data", {
      jobId,
      source,
      createdAt: new Date().toISOString(),
      payload: results,
      attempt: job.attemptsMade,
    });

    logger.info(
      { jobId, source, count: results.length },
      "Scraper done, pushed to RAW queue",
    );
  },
  {
    connection,
    concurrency: parseInt(process.env.SCRAPER_CONCURRENCY ?? "3"),
  },
);
