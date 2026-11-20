import { Resolver } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";
import { checkServerIdentity } from "node:tls";

const ATTEMPT_TIMEOUT_MS = 10_000;
const CONCURRENCY = 4;
const MAX_REDIRECTS = 5;
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
type Status = "successful" | "failed" | "inconclusive";

interface AttemptResult {
  status: Status;
  reason: string;
  finalUrl?: string;
  retry?: boolean;
}

interface LinkResult extends Omit<AttemptResult, "retry"> {
  url: string;
}

export interface LinkTransport {
  resolve(hostname: string, signal: AbortSignal): Promise<string[]>;
  get(url: URL, address: string, signal: AbortSignal): Promise<{ status: number; location?: string }>;
}

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) blocked.addSubnet(network, prefix, "ipv4");

for (const [network, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
] as const) blocked.addSubnet(network, prefix, "ipv6");

const globalIPv6 = new BlockList();
globalIPv6.addSubnet("2000::", 3, "ipv6");

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  return family === 6 && !address.includes("%")
    && globalIPv6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}

function hostnameFor(url: URL): string {
  return url.hostname.replace(/^\[|\]$|\.$/g, "");
}

function parseTarget(value: string, base?: URL): URL | undefined {
  if (/[\\\p{Cc}]/u.test(value) || (!base && !/^https:\/\//i.test(value))) return;
  const url = URL.parse(value, base);
  if (!url || url.protocol !== "https:" || url.username || url.password) return;
  const hostname = hostnameFor(url);
  if (isIP(hostname) ? !isPublicAddress(hostname) :
    !hostname.includes(".") || /(?:^|\.)(?:localhost|local|home\.arpa|internal)$/i.test(hostname)) return;
  url.hash = "";
  return url;
}

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
}

async function resolveAddresses(hostname: string, signal: AbortSignal): Promise<string[]> {
  signal.throwIfAborted();
  const resolver = new Resolver();
  const cancel = () => resolver.cancel();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const responses = await Promise.allSettled([resolver.resolve4(hostname), resolver.resolve6(hostname)]);
    return responses.flatMap((response) => {
      if (response.status === "fulfilled") return response.value;
      if (["ENODATA", "ENOTFOUND"].includes(errorCode(response.reason) ?? "")) return [];
      throw response.reason;
    });
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}

export const httpsTransport: LinkTransport = {
  resolve: resolveAddresses,
  get(url, address, signal) {
    const hostname = hostnameFor(url);
    return new Promise((resolve, reject) => {
      // Connect to the checked IP directly to prevent a second DNS lookup from changing the destination.
      // Keep the resource hostname for Host, SNI and certificate verification.
      const req = request({
        hostname: address,
        port: url.port || 443,
        method: "GET",
        path: url.pathname + url.search,
        headers: {
          Host: url.host,
          "User-Agent": "Mozilla/5.0 (compatible; STEMBridge-LinkChecker/1.0)",
        },
        agent: false,
        servername: isIP(hostname) ? "" : hostname,
        rejectUnauthorized: true,
        checkServerIdentity: (_name, cert) => checkServerIdentity(hostname, cert),
        signal,
      }, (res) => {
        resolve({ status: res.statusCode ?? 0, location: res.headers.location });
        res.destroy(); // Only headers are needed.
      });
      req.once("error", reject);
      req.end();
    });
  },
};

async function follow(
  original: URL, transport: LinkTransport, signal: AbortSignal,
): Promise<AttemptResult> {
  let url = original;
  const visited = new Set<string>();
  const hosts = new Set<string>();
  for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
    if (visited.has(url.href)) return { status: "failed", reason: "redirect loop", finalUrl: url.href };
    visited.add(url.href);
    const hostname = hostnameFor(url);
    hosts.add(hostname);
    const addresses = isIP(hostname) ? [hostname] : await transport.resolve(hostname, signal);
    signal.throwIfAborted();
    if (addresses.length === 0) return { status: "failed", reason: "hostname has no IP addresses", finalUrl: url.href };
    if (addresses.some((address) => !isPublicAddress(address))) {
      return { status: "failed", reason: "hostname resolved to a non-public address", finalUrl: url.href };
    }
    const { status, location } = await transport.get(url, addresses[0], signal);
    signal.throwIfAborted();
    if (redirectStatuses.has(status)) {
      if (!location?.trim()) return { status: "failed", reason: "redirect without a Location header", finalUrl: url.href };
      const next = parseTarget(location, url);
      if (!next) return { status: "failed", reason: "unsafe redirect destination", finalUrl: url.href };
      if (hops === MAX_REDIRECTS) return { status: "failed", reason: "redirect limit exceeded", finalUrl: url.href };
      url = next;
      continue;
    }
    const finalUrl = url.href;
    const reason = `HTTP ${status}${hosts.size > 1 ? `; redirect changed hostname (${[...hosts].join(" → ")})` : ""}`;
    if (status >= 200 && status < 300) {
      return { status: hosts.size === 1 ? "successful" : "inconclusive", reason, finalUrl };
    }
    if (status === 401 || status === 403 || status === 429 || status === 451) {
      return { status: "inconclusive", reason, finalUrl };
    }
    if (status === 408 || status === 425 || status >= 500) return { status: "inconclusive", reason, finalUrl, retry: true };
    return { status: "failed", reason, finalUrl };
  }
  throw new Error("Redirect loop exceeded its bound");
}

async function attempt(url: URL, transport: LinkTransport): Promise<AttemptResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    return await follow(url, transport, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) return { status: "inconclusive", reason: "timed out after 10 seconds", retry: true };
    const code = errorCode(error);
    return { status: "inconclusive", reason: "connection or DNS error", retry:
      code === undefined || ["ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "ETIMEOUT", "ETIMEDOUT", "ESERVFAIL"].includes(code) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkLink(url: string, transport: LinkTransport): Promise<LinkResult> {
  const original = parseTarget(url);
  if (!original) return { url, status: "failed", reason: "expected a public HTTPS URL without credentials" };
  let result = await attempt(original, transport);
  const retried = result.retry;
  if (retried) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    result = await attempt(original, transport);
  }
  return { url, status: result.status, finalUrl: result.finalUrl, reason: retried ? `${result.reason} (after retry)` : result.reason };
}

export async function checkLinks(urls: readonly string[], transport = httpsTransport): Promise<LinkResult[]> {
  const results: LinkResult[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
    while (next < urls.length) {
      const index = next++;
      results[index] = await checkLink(urls[index], transport);
    }
  });
  await Promise.all(workers);
  return results;
}
