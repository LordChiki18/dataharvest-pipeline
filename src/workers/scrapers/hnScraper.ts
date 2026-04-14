  import axios from 'axios';
  import * as cheerio from 'cheerio';
  import { logger } from '../../logger';

  const BASE_URL = 'https://news.ycombinator.com';

  function getStoryType(title: string): string {
    if (title.startsWith('Ask HN')) return 'ask';
    if (title.startsWith('Show HN')) return 'show';
    if (title.toLowerCase().includes('hiring') || title.startsWith('Who is hiring')) return 'job';
    return 'story';
  }

  export async function scrapeHN(delayMs = 1000) {
    const stories = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= 2; page++) {
      const url = `${BASE_URL}/newest?p=${page}`;
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'DataHarvestBot/1.0 (tech-assessment)' },
      });
      const $ = cheerio.load(data);

      const rows = $('tr.athing').toArray();

      for (const el of rows) {
        const hnItemId = $(el).attr('id') ?? '';
        if (seenIds.has(hnItemId)) continue;
        seenIds.add(hnItemId);

        const title = $(el).find('.titleline a').first().text().trim();
        const url = $(el).find('.titleline a').first().attr('href') ?? null;

        const subtext = $(el).next('tr').find('.subtext');
        const score = parseInt(subtext.find('.score').text()) || 0;
        const author = subtext.find('.hnuser').text().trim();
        const ageText = subtext.find('.age').text().trim();
        const commentText = subtext.find('a').last().text();
        const commentCount = parseInt(commentText) || 0;
        const storyType = getStoryType(title);

        stories.push({ hnItemId, title, url, score, author, ageText, commentCount, storyType });
        logger.info({ hnItemId, title }, 'HN story scraped');
      }

      await new Promise(res => setTimeout(res, delayMs));
    }

    return stories;
  }