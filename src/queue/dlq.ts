import Redis from "ioredis";
import { Queue } from "bullmq";

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const dlqQueue = new Queue("scrape-dlq", { connection });
