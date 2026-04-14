import express from "express";
import { jobsRouter } from "./routes/jobs";
import { booksRouter } from "./routes/books";
import { storiesRouter } from "./routes/stories";
import { metricsRouter } from "./routes/metrics";

export const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/jobs", jobsRouter);
app.use("/api/v1/books", booksRouter);
app.use("/api/v1/stories", storiesRouter);
app.use("/api/v1/metrics", metricsRouter);