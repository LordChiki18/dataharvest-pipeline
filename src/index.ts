import "dotenv/config";
import { app } from "./api/server";
import { scraperWorker } from "./workers/scraperWorker";
import { transformerWorker } from "./transformer/transformerWorker";
import { persisterWorker } from "./persister/persisterWorker";
import { startScheduler } from "./scheduler";
import { logger } from "./logger";

const PORT = process.env.PORT ?? 3000;

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection:");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught Exception:");
  process.exit(1);
});
async function shutdown() {
  logger.info("Shutting down...");
  await scraperWorker.close();
  await transformerWorker.close();
  await persisterWorker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startScheduler();

app.listen(PORT, () => {
  logger.info({ PORT }, "Server running");
});
