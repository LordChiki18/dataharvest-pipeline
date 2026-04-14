import { Router } from "express";
import { db } from "../../db/client";

export const booksRouter = Router();

booksRouter.get("/", async (req, res) => {
  const { category, minRating, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const query = db("books").orderBy("scraped_at", "desc");
  if (category) query.where({ category });
  if (minRating) query.where("rating", ">=", Number(minRating));
  query.limit(Number(limit)).offset(offset);

  const books = await query;
  res.json({ books });
});

booksRouter.get("/:upc", async (req, res) => {
  const book = await db("books").where({ upc: req.params.upc }).first();

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(book);
});
