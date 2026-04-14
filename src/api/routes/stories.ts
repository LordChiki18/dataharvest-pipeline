import { Router } from "express";
import { db } from "../../db/client";
import { logger } from "../../logger";

export const storiesRouter = Router();

storiesRouter.get("/", async (req, res) => {
  try {
    const { title, author, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const query = db("hn_stories").orderBy("scraped_at");
    if (title) query.where({ title });
    if (author) query.where({ author });
    query.limit(Number(limit)).offset(offset);

    const stories = await query;
    return res.json({ stories });
  } catch (error) {
    logger.error({ error }, "Error fetching stories");
    res.status(500).json({ error: "Internal server error" });
  }
});

storiesRouter.get("/:itemId", async (req, res) => {
  try {
    const storie = await db("hn_stories")
      .where({ hn_item_id: req.params.itemId })
      .first();
    if (!storie) {
      res.status(404).json({ error: "Storie not found" });
      return;
    }
    res.json(storie);
  } catch (error) {
    logger.error({ error }, "Error fetching storie");
    res.status(500).json({ error: "Internal server error" });
  }
});
