import "server-only";
import { interestTagSchema } from "../schemas";
import type { InterestTag } from "../types";

const keywordsByTag = {
  robots: ["robot", "robots", "robotic", "robotics", "arduino", "automation"],
  coding: ["code", "coding", "program", "programs", "programming", "python", "javascript", "software",
    "computer", "computers", "video game", "video games", "app", "apps", "application development"],
  space: ["space", "planet", "planets", "nasa", "rocket", "rockets", "satellite", "satellites", "astronomy",
    "star", "stars", "astronaut", "astronauts"],
  biology: ["biology", "organism", "organisms", "genetics", "cell", "cells", "wildlife", "animal", "animals"],
  environment: ["environment", "environmental", "climate", "ecology", "conservation", "pollution",
    "nature", "ocean", "oceans", "weather", "chemistry"],
  building: ["build", "building", "construct", "construction", "prototype", "prototypes", "prototyping", "engineering"],
  health: ["health", "healthcare", "medicine", "medical", "patient", "patients"],
  "data-math": ["data", "math", "maths", "mathematics", "statistics", "probability", "algebra", "analytics",
    "physics", "ai", "artificial intelligence", "machine learning"],
  electronics: ["electronics", "electrical", "circuit", "circuits", "sensor", "sensors"],
  security: ["security", "cybersecurity", "cyber security", "privacy", "hacking", "hacker", "hackers", "cryptography"],
  design: ["design", "designing", "drawing", "sketching", "cad", "usability"],
} satisfies Record<InterestTag, readonly string[]>;

const tagByKeyword = new Map(
  interestTagSchema.options.flatMap((tag) => keywordsByTag[tag].map((keyword) => [keyword, tag] as const)),
);

export function getKeywordTags(tokens: readonly string[]): Set<InterestTag> {
  const tags = new Set<InterestTag>();
  for (const [index, token] of tokens.entries()) {
    const tag = tagByKeyword.get(token);
    if (tag !== undefined) tags.add(tag);
    const next = tokens[index + 1];
    const phraseTag = next === undefined ? undefined : tagByKeyword.get(`${token} ${next}`);
    if (phraseTag !== undefined) tags.add(phraseTag);
  }
  return tags;
}
