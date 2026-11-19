import "server-only";
import { listCareers } from "../catalog";
import type { InterestTag, Interests, RecommendResponse } from "../types";
import { getKeywordTags } from "./keywords";
import { tokenize } from "./normalize";

const tagLabels: Record<InterestTag, string> = {
  robots: "robots",
  coding: "coding",
  space: "space",
  biology: "biology",
  environment: "the environment",
  building: "building things",
  health: "health",
  "data-math": "data and math",
  electronics: "electronics",
  security: "security",
  design: "design",
};

type CatalogCareer = ReturnType<typeof listCareers>[number];
const limit = 3;

function diverseDefaults(careers: readonly CatalogCareer[]): CatalogCareer[] {
  const fields = new Set<CatalogCareer["field"]>();
  const firstByField = careers.filter(({ field }) => {
    if (fields.has(field)) return false;
    fields.add(field);
    return true;
  });
  const selected = new Set(firstByField.map(({ id }) => id));
  return [...firstByField, ...careers.filter(({ id }) => !selected.has(id))].slice(0, limit);
}

function toCard(career: CatalogCareer, matches: readonly InterestTag[]): RecommendResponse["careers"][number] {
  const matchedLabels = matches.slice(0, 2).map((tag) => tagLabels[tag]);
  const reason = matchedLabels.length > 0
    ? `Matches your interest in ${matchedLabels.join(" and ")}.`
    : `A great starting point if you're exploring ${career.field}.`;
  return { id: career.id, title: career.title, summary: career.summary, keySkills: [...career.keySkills], reason };
}

export function recommend({ interests, tags }: Interests): RecommendResponse["careers"] {
  const careers = listCareers();
  const chipTags = new Set(tags);
  const keywordTags = getKeywordTags(tokenize(interests));
  const ranked = careers.map((career, position) => {
    const chips = career.tags.filter((tag) => chipTags.has(tag));
    const keywords = career.tags.filter((tag) => !chipTags.has(tag) && keywordTags.has(tag));
    return { career, position, score: 2 * chips.length + keywords.length, matches: [...chips, ...keywords] };
  }).sort((a, b) => b.score - a.score || a.position - b.position);

  if (!ranked.length || ranked[0].score === 0) {
    return diverseDefaults(careers).map((career) => toCard(career, []));
  }
  return ranked.slice(0, limit).map(({ career, matches }) => toCard(career, matches));
}
