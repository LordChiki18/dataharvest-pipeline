import { z } from "zod";

export const jobPayloadSchema = z.object({
  jobId: z.string().uuid(),
  source: z.enum(["books", "hackernews"]),
  createdAt: z.string(),
  attempt: z.number(),
});

export type JobPayload = z.infer<typeof jobPayloadSchema>;
