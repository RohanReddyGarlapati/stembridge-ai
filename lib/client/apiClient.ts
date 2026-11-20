import type { z } from "zod";
import { apiErrorResponseSchema, recommendResponseSchema, roadmapResponseSchema } from "../schemas";
import type { RecommendRequest } from "../types";

const messages = {
  aborted: "Request cancelled.",
  timeout: "This is taking longer than usual. Please try again.",
  network: "Couldn’t connect. Check your connection and try again.",
  invalid: "Check your interests or career selection and try again.",
  unexpected: "Something went wrong. Please try again.",
  response: "We couldn’t load these results. Please try again.",
  limited: "Too many requests. Please wait a moment before trying again.",
} as const;

class ClientRequestError extends Error {
  constructor(readonly kind: keyof typeof messages, readonly retryAt: number | null = null) {
    super(retryAt === null ? messages[kind] : retryMessage(retryAt));
    if (kind === "aborted") this.name = "AbortError";
  }
}

function retryTime(header: string | null, now: number): number | null {
  const value = header?.trim();
  if (!value) return null;
  // Retry-After is either a non-negative integer or an HTTP date.
  const at = /^\d+$/.test(value)
    ? now + Number(value) * 1000
    : /^[a-z]{3},\s/i.test(value) ? Date.parse(value) : NaN;
  return Number.isSafeInteger(at) && at > now ? at : null;
}

function retryMessage(retryAt: number): string {
  const seconds = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
  const count = seconds < 60 ? seconds : Math.ceil(seconds / 60);
  const unit = seconds < 60 ? "second" : "minute";
  return `Too many requests. Try again in about ${count} ${unit}${count === 1 ? "" : "s"}.`;
}

export function requestFailure(error: unknown): { message: string; retryAt: number | null } {
  return error instanceof ClientRequestError
    ? { message: error.message, retryAt: error.retryAt }
    : { message: messages.unexpected, retryAt: null };
}

async function post<T>(path: string, input: object, schema: z.ZodType<T>, signal: AbortSignal): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let forwardAbort: (() => void) | undefined;
  let timedOut = false;
  try {
    if (signal.aborted) throw new ClientRequestError("aborted");
    const request = new AbortController();
    forwardAbort = () => request.abort();
    signal.addEventListener("abort", forwardAbort, { once: true });
    timer = setTimeout(() => {
      timedOut = true;
      request.abort();
    }, 10_000);

    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: request.signal,
      cache: "no-store",
    });
    if (response.status === 429) throw new ClientRequestError("limited", retryTime(response.headers.get("retry-after"), Date.now()));

    const raw: unknown = await response.json().catch(() => undefined);
    if (request.signal.aborted) throw new ClientRequestError("aborted");
    if (!response.ok) {
      const error = apiErrorResponseSchema.safeParse(raw);
      throw new ClientRequestError(error.success && error.data.error.code === "INVALID_INPUT" ? "invalid" : "unexpected");
    }

    const result = schema.safeParse(raw);
    if (!result.success) throw new ClientRequestError("response");
    return result.data;
  } catch (error) {
    if (signal.aborted) throw new ClientRequestError("aborted");
    if (timedOut) throw new ClientRequestError("timeout");
    if (error instanceof ClientRequestError) throw error;
    throw new ClientRequestError(error instanceof TypeError ? "network" : "unexpected");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (forwardAbort) signal.removeEventListener("abort", forwardAbort);
  }
}

export function fetchRecommendations(input: RecommendRequest, signal: AbortSignal) {
  return post("/api/recommend", input, recommendResponseSchema, signal);
}

export function fetchRoadmap(careerId: string, signal: AbortSignal) {
  return post("/api/roadmap", { careerId }, roadmapResponseSchema, signal);
}
