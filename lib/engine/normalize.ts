import "server-only";

export function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase()
    .replace(/\p{Cf}/gu, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const normalized = normalize(text);
  return normalized ? normalized.split(" ") : [];
}
