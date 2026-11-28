// Maitland Valley Conservation Authority flood messages, from the "Flood Notices" category feed on mvca.on.ca.
// Each message ends with "This message is in effect until <time> on <weekday> <Month> <day>, <year>"; a message
// counts as current until the end of that day. If no date can be read, it counts as current for 7 days after it
// was posted. Cached per isolate for 15 minutes.

import { cachedHandler, fetchFeed } from '../_lib/rss';

const FEED_URL = 'https://mvca.on.ca/category/flood/feed/';
const UNDATED_DAYS = 7;

const level = (title: string) =>
  /flood warning/i.test(title)
    ? 'FLOOD_WARNING'
    : /flood watch/i.test(title)
      ? 'FLOOD_WATCH'
      : /watershed conditions|flood outlook|water safety/i.test(title)
        ? 'CONDITIONS_STATEMENT'
        : 'NOTICE';

// End of the stated day (America/Toronto, ~05:00 UTC the next day), or null
function expiry(text: string): Date | null {
  const m = text.match(/in effect until.{0,80}?([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const d = new Date(`${m[1]} ${m[2]}, ${m[3]} 00:00 UTC`);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 29 * 3600_000);
}

export const onRequestGet: PagesFunction = cachedHandler(15 * 60_000, 300, async (signal) => {
  const latest = (await fetchFeed(FEED_URL, signal))[0];
  if (!latest) return { current: false, notice: null };

  const expires = expiry(latest.content || latest.description);
  const until = expires ?? new Date(latest.date.getTime() + UNDATED_DAYS * 86400_000);
  // The first paragraph says what was issued and for where
  const summary = (latest.content || latest.description).split(/(?<=\.)\s/).slice(0, 2).join(' ').slice(0, 400);
  return {
    current: until.getTime() > Date.now(),
    notice: {
      title: latest.title,
      level: level(latest.title),
      link: latest.link,
      date: latest.date.toISOString(),
      expires: expires?.toISOString() ?? null,
      summary,
    },
  };
});
