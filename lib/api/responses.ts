import "server-only";
import type { z } from "zod";
import { apiErrorResponseSchema } from "../schemas";
import { guardRequest } from "./guard";
import { readJsonBody } from "./readJsonBody";
import { ApiRequestError } from "./requestError";

function errorResponse(error: ApiRequestError): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (error.retryAfter !== undefined) headers.set("Retry-After", String(error.retryAfter));
  const body = apiErrorResponseSchema.parse({ error: { code: error.code, message: error.message } });
  return Response.json(body, { status: error.status, headers });
}

export function createPostHandler<Input, Output>(
  route: "/api/recommend" | "/api/roadmap",
  requestSchema: z.ZodType<Input>,
  responseSchema: z.ZodType<Output>,
  handle: (input: Input) => { body: Output; resultCount: number },
) {
  return async (request: Request): Promise<Response> => {
    const start = performance.now();
    let status = 500;
    let resultCount = 0;
    try {
      let rawInput: unknown;
      try {
        guardRequest(request);
        rawInput = await readJsonBody(request);
      } catch (error) {
        if (!(error instanceof ApiRequestError)) throw error;
        status = error.status;
        return errorResponse(error);
      }

      const input = requestSchema.safeParse(rawInput);
      if (!input.success) {
        status = 400;
        return errorResponse(new ApiRequestError(400, "INVALID_INPUT", "Check the fields in your request."));
      }

      const result = handle(input.data);
      const body = responseSchema.parse(result.body);
      const response = Response.json(body, { headers: { "Cache-Control": "no-store" } });
      status = 200;
      resultCount = result.resultCount;
      return response;
    } catch {
      status = 500;
      return errorResponse(new ApiRequestError(500, "INTERNAL", "Something went wrong. Please try again."));
    } finally {
      console.info(JSON.stringify({
        route, status, ms: Math.round(performance.now() - start), personalization: "none", resultCount,
      }));
    }
  };
}
