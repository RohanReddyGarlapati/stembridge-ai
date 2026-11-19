import "server-only";
import { ApiRequestError } from "./requestError";

const MAX_BYTES = 4096;

function oversizedBody() {
  return new ApiRequestError(413, "PAYLOAD_TOO_LARGE", "Request body must be at most 4 KB.");
}

function invalidJson() {
  return new ApiRequestError(400, "INVALID_JSON", "Request body must contain valid UTF-8 JSON.");
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length !== null && /^\d+$/.test(length) && Number(length) > MAX_BYTES) {
    void request.body?.cancel().catch(() => {});
    throw oversizedBody();
  }
  if (!request.body) throw invalidJson();

  const reader = request.body.getReader();
  const buffer = new Uint8Array(MAX_BYTES);
  let used = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (chunk.value.byteLength > MAX_BYTES - used) {
        void reader.cancel().catch(() => {});
        throw oversizedBody();
      }
      buffer.set(chunk.value, used);
      used += chunk.value.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, used));
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw invalidJson();
  } finally {
    reader.releaseLock();
  }
}
