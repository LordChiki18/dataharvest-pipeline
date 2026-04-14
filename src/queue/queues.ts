import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!);

const pending = new Queue("scrape:pending", { connection });
const raw = new Queue("scrape:raw", { connection });
const processed = new Queue("scrape:processed", { connection });

export { pending, raw, processed };
