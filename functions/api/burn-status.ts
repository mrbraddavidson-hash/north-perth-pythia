// North Perth open-air fire ban status, read from the Municipality of North Perth's news RSS feed.
// Perth County bans and lifts are posted there ("Open Air Fire Ban in Perth County" / "... Lifted ...").
// The newest ban-related notice decides the status. Cached per isolate for 15 minutes.

import { cachedHandler, fetchFeed } from '../_lib/rss';

const FEED_URL = 'https://www.northperth.ca/news/rss';
const BAN_TITLE = /\b(fire|burn(ing)?)\s+ban\b/i;
const LIFTED_TITLE = /\b(lift|lifted|rescind|rescinded|cancel|cancelled|ended)\b/i;

export const onRequestGet: PagesFunction = cachedHandler(15 * 60_000, 300, async (signal) => {
  const latest = (await fetchFeed(FEED_URL, signal)).find((n) => BAN_TITLE.test(n.title));
  return {
    status: !latest ? 'NO_NOTICE' : LIFTED_TITLE.test(latest.title) ? 'NO_BAN' : 'BAN',
    notice: latest ? { title: latest.title, link: latest.link, date: latest.date.toISOString() } : null,
  };
});
