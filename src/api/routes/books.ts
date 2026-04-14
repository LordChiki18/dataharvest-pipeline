import { Router } from "express";
import { db } from "../../db/client";
import { logger } from "../../logger";

export const booksRouter = Router();

booksRouter.get("/", async (req, res) => {
  try {
    const { category, minRating, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const query = db("books").orderBy("scraped_at", "desc");
    if (category) query.where({ category });
    if (minRating) query.where("rating", ">=", Number(minRating));
    query.limit(Number(limit)).offset(offset);

    const books = await query;
    res.json({ books });
  } catch (error) {
    logger.error({ error }, "Error fetching books");
    res.status(500).json({ error: "Internal server error" });
  }
});

booksRouter.get("/:upc", async (req, res) => {
  try {
    const book = await db("books").where({ upc: req.params.upc }).first();

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    res.json(book);
  } catch (error) {
    logger.error({ error }, "Error fetching books");
    res.status(500).json({ error: "Internal server error" });
  }
});
