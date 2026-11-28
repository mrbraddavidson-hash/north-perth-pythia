import { useEffect, useState } from 'react';

// Loads data now and every `intervalMs` while the tab is visible. `null` from the loader counts as a failure;
// the last good value is kept so a failed refresh doesn't blank the card.
export function usePolled<T>(load: () => Promise<T | null>, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const d = await load();
      if (cancelled) return;
      if (d !== null) {
        setData(d);
        setFailed(false);
      } else setFailed(true);
    };
    run();
    const timer = window.setInterval(() => {
      if (!document.hidden) run();
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [load, intervalMs]);

  return { data, failed };
}
