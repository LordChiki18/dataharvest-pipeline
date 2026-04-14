import cron from "node-cron";
import { pending } from "../queue/queues";
import { logger } from "../logger";
import { v4 as uuidv4 } from "uuid";

export function startScheduler() {
  const booksSchedule = process.env.BOOK_SCHEDULE || "0 2 * * *"; // Default: daily at 2 AM
  const hnSchedule = process.env.HN_SCHEDULE || "*/15 * * * *"; // Default: every 15 minutes

  cron.schedule(booksSchedule, async () => {
    const jobId = uuidv4();
    await pending.add(
      "scrape-books",
      {
        jobId,
        source: "books",
        createdAt: new Date().toISOString(),
        attempts: 0,
      },
      {
        priority: 2,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );
    logger.info({ jobId }, "Books scrape job scheduled");
  });

  cron.schedule(hnSchedule, async () => {
    const jobId = uuidv4();
    await pending.add(
      "scrape-hn",
      {
        jobId,
        source: "hackernews",
        createdAt: new Date().toISOString(),
        attempt: 0,
      },
      {
        priority: 1,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );
    logger.info({ jobId }, "Hacker News scrape job scheduled");
  });
  logger.info("Scheduler started");
}
