import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../../logger";

const BASE_URL = "https://books.toscrape.com/";
const RATING_MAP: Record<string, number> = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
};

async function getBookDetail(url: string) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "DataHarvestBot/1.0 (tech-assessment)" },
  });
  const $ = cheerio.load(data);

  const upc = $("table.table-striped tr").eq(0).find("td").text();
  const description = $("#product_description").next("p").text().trim() || null;
  const numReviews =
    parseInt($("table.table-striped tr").eq(6).find("td").text()) || 0;

  return { upc, description, numReviews };
}

export async function scrapeBooks(delayMs = 1000) {
  const books = [];

  for (let page = 1; page <= 5; page++) {
    const url =
      page === 1
        ? `${BASE_URL}/catalogue/page-${page}.html`
        : `${BASE_URL}/catalogue/page-${page}.html`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "DataHarvestBot/1.0 (tech-assessment)" },
    });
    const $ = cheerio.load(data);

    const articles = $("article.product_pod").toArray();

    for (const el of articles) {
      const title = $(el).find("h3 a").attr("title") ?? "";
      const priceText = $(el).find(".price_color").text();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      const ratingClass = $(el).find(".star-rating").attr("class") ?? "";
      const ratingWord = ratingClass.split(" ")[1] ?? "One";
      const rating = RATING_MAP[ratingWord] ?? 1;
      const available =
        $(el).find(".availability").text().trim() === "In stock";
      const relativeUrl = $(el).find("h3 a").attr("href") ?? "";
      const productUrl = `${BASE_URL}/catalogue/${relativeUrl.replace("../", "")}`;

      const category = "Unknown";

      await new Promise((res) => setTimeout(res, delayMs));
      const detail = await getBookDetail(productUrl);

      books.push({
        title,
        price,
        rating,
        available,
        category,
        productUrl,
        ...detail,
      });
      logger.info({ title }, "Book scraped");
    }

    logger.info({ page }, "Page scraped");
  }
  return books;
}
