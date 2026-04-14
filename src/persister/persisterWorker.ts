import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { db } from "../db/client";
import { logger } from "../logger";

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const persisterWorker = new Worker(
  "scrape-processed",
  async (job: Job) => {
    const { source, jobId, payload } = job.data;
    logger.info({ jobId, source }, "Persister processing job");

    try {
      if (source === "books") {
        for (const book of payload) {
          await db("books")
            .insert({
              upc: book.upc,
              title: book.title,
              price_gbp: book.price,
              rating: book.rating,
              category: book.category,
              available: book.available,
              description: book.description,
              num_reviews: book.numReviews,
            })
            .onConflict("upc")
            .merge();
        }
      } else if (source === "hackernews") {
        for (const story of payload) {
          await db("hn_stories")
            .insert({
              hn_item_id: story.hnItemId,
              title: story.title,
              url: story.url,
              score: story.score,
              author: story.author,
              comment_count: story.commentCount,
              story_type: story.storyType,
            })
            .onConflict("hn_item_id")
            .merge();
        }
      }
      await db("scrape_jobs")
        .where({ id: jobId })
        .update({ status: "done", completed_at: new Date() });
      logger.info({ jobId, source }, "Persister done");
    } catch (error) {
      await db("scrape_jobs")
        .where({ id: jobId })
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        });
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.PERSISTER_CONCURRENCY ?? "2"),
  },
);
