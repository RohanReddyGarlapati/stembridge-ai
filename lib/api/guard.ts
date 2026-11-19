import "server-only";
import { isIP } from "node:net";
import { createRateLimiter } from "./rateLimit";
import { ApiRequestError } from "./requestError";

const limitByClient = createRateLimiter();
const jsonContentType = /^application\/json(?:[ \t]*;[ \t]*charset[ \t]*=[ \t]*(?:utf-8|"utf-8"))?$/i;

function clientKey(request: Request): string {
  // Only trust forwarding headers on the intended hosting platform.
  const ip = process.env.VERCEL === "1"
    ? request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim()
    : undefined;
  return ip && isIP(ip) ? ip.toLowerCase() : "direct";
}

function requestOrigin(request: Request): string | undefined {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) return configured;
  const url = new URL(request.url);
  // Next can use its internal hostname when constructing Request.url.
  const host = request.headers.get("host");
  if (host === null) return url.origin;
  if (!/^[^/\\?#@\s]+$/.test(host)) return undefined;
  return URL.parse(`${url.protocol}//${host}`)?.origin;
}

export function guardRequest(request: Request, rateLimit = limitByClient): void {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site"
    || (origin !== null && origin !== requestOrigin(request))) {
    throw new ApiRequestError(403, "FORBIDDEN", "Request must come from this site.");
  }

  const configuredLimit = Number(process.env.RATE_LIMIT_PER_MIN);
  const limit = Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 30;
  const retryAfter = rateLimit(clientKey(request), limit);
  if (retryAfter > 0) {
    throw new ApiRequestError(429, "RATE_LIMITED", "Too many requests. Please wait a moment.", retryAfter);
  }

  if (!jsonContentType.test(request.headers.get("content-type") ?? "")) {
    throw new ApiRequestError(415, "UNSUPPORTED_MEDIA_TYPE", "Send the request as application/json.");
  }
}
