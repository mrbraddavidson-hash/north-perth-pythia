// Recent North Perth notices about roads, water and construction, from the municipality's news RSS feed.
// Planning notices (zoning, committee of adjustment), council highlights and general news are left out.
// Cached per isolate for 15 minutes.

import { cachedHandler, fetchFeed } from '../_lib/rss';

const FEED_URL = 'https://www.northperth.ca/news/rss';
const WINDOW_DAYS = 60;
const MAX_NOTICES = 6;

const CATEGORIES: [string, RegExp][] = [
  ['WATER', /\b(boil water|water main|watermain|water (service )?(interruption|disruption|advisory)|hydrant|flushing|sewer|wastewater)\b/i],
  ['ROAD', /\b(road|street|st|ave|avenue|line|sideroad|lane|bridge|detour|closure|closed|winter parking|overnight parking|snow removal|plow|plough)\b/i],
  ['CONSTRUCTION', /\b(construction|rehabilitation|replacement|repair|resurfacing|paving)\b/i],
  ['PUBLIC_WORKS', /\b(pesticide|spraying|outage|waste|garbage|recycling|leaf|brush)\b/i],
];
const EXCLUDE = /\b(zoning|by-law|committee of adjustment|council highlights|election|candidates|appointments)\b/i;

export const onRequestGet: PagesFunction = cachedHandler(15 * 60_000, 300, async (signal) => {
  const since = Date.now() - WINDOW_DAYS * 86400_000;
  const notices = (await fetchFeed(FEED_URL, signal))
    .filter((n) => n.date.getTime() >= since && !EXCLUDE.test(n.title))
    .map((n) => ({ n, category: CATEGORIES.find(([, re]) => re.test(n.title))?.[0] }))
    .filter((x) => x.category)
    .slice(0, MAX_NOTICES)
    .map(({ n, category }) => ({
      title: n.title,
      category,
      link: n.link,
      date: n.date.toISOString(),
      summary: n.description.replace(/\s*Continue reading\s*$/i, '').slice(0, 240),
    }));
  return { notices, windowDays: WINDOW_DAYS };
});
