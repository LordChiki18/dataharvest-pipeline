import { Router } from "express";
import { db } from "../../db/client";

export const storiesRouter = Router();

storiesRouter.get("/", async (req, res) => {
  const { title, author, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const query = db("hn_stories").orderBy("scraped_at");
  if (title) query.where({ title });
  if (author) query.where({ author });
  query.limit(Number(limit)).offset(offset);

  const stories = await query;
  return res.json({ stories });
});

storiesRouter.get("/:itemId", async (req, res) => {
  const storie = await db("hn_stories")
    .where({ hn_item_id: req.params.itemId })
    .first();
  if (!storie) {
    res.status(404).json({ error: "Storie not found" });
    return;
  }
  res.json(storie);
});
