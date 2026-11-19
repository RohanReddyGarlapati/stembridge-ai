import "server-only";

const WINDOW_MS = 60_000;
const MAX_CLIENTS = 4096;

export function createRateLimiter(now: () => number = Date.now) {
  const requests = new Map<string, number[]>();
  let nextSweep = 0;

  // Return zero when allowed, or the Retry-After delay in seconds.
  return (key: string, limit: number): number => {
    const time = now();
    const cutoff = time - WINDOW_MS;
    if (time >= nextSweep) {
      for (const [client, timestamps] of requests) {
        if (timestamps[timestamps.length - 1] <= cutoff) requests.delete(client);
      }
      nextSweep = time + WINDOW_MS;
    }

    const previous = requests.get(key);
    if (!previous && requests.size >= MAX_CLIENTS) {
      return Math.max(1, Math.ceil((nextSweep - time) / 1000));
    }
    const recent = previous?.filter((timestamp) => timestamp > cutoff) ?? [];
    if (recent.length >= limit) {
      return Math.max(1, Math.ceil((recent[recent.length - limit] + WINDOW_MS - time) / 1000));
    }
    recent.push(time);
    requests.set(key, recent);
    return 0;
  };
}
