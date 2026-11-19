# STEMBridge AI — Implementation Tasks

Status: Draft v2 (revised after architecture review)
References: [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [TEST_PLAN.md](TEST_PLAN.md)

Ordered by dependency, then priority. The **deterministic journey is built, deployed, and released first** (Phases 0–5, about 19 h). AI personalization (Phase 6) is post-MVP and gated.

Legend: **P0** must ship · **P1** should ship · `deps` = must be done first · **[H]** = needs human judgment (cannot be delegated to a coding agent).

---

## Phase 0 — Setup (~1.5 h)

| ID | Task | Pri | Est | Deps | Done when |
|---|---|---|---|---|---|
| T0.1 | Scaffold Next.js (App Router, TypeScript strict, Tailwind, ESLint, no `src/`). Add deps: `zod`, `server-only`; dev: `vitest`, `@playwright/test`, `tsx`. Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `check-links`, `check-bundle`. Add `.env.example` (`AI_PROVIDER=none`, `RATE_LIMIT_PER_MIN=30`, `APP_ORIGIN=`). | P0 | 0.75 h | — | `npm run dev`, `lint`, `typecheck`, `test` (empty) all succeed. |
| T0.2 | Push to GitHub; connect Vercel; enable Deployment Protection for previews; deploy the placeholder page to production. | P0 | 0.5 h | T0.1 | Public production URL loads. |
| T0.3 | Add security headers in `next.config.ts` (ARCHITECTURE §8). | P0 | 0.25 h | T0.1 | Headers visible on `/` locally. |

## Phase 1 — Catalog foundation (~5 h)

| ID | Task | Pri | Est | Deps | Done when |
|---|---|---|---|---|---|
| T1.1 | `lib/schemas.ts`: Zod schemas for `InterestTag` enum, `Resource`, `RoadmapStep`, `Career`, catalog files, strict API requests, API responses, and the error shape. `lib/types.ts` exports inferred types. | P0 | 1 h | T0.1 | Typecheck passes; schema unit tests pass. |
| T1.2 | `lib/catalog.ts`: parse catalog at module load, build indexes (`getCareer`, `getResource`, `listCareers`, `careerIds`), cross-reference validation. Seed `data/*.json` with **2 placeholder careers and 6 placeholder resources** marked `example.com` URLs so code and tests can proceed. | P0 | 0.75 h | T1.1 | Integrity tests (U-CAT-*) pass on seed data. |
| T1.3 | Integrity tests U-CAT-1 to U-CAT-9 (counts are checked by a separate "release" test that is skipped while `CATALOG_SEED=1`). | P0 | 0.5 h | T1.2 | Green. |
| T1.4 **[H]** | Author the real catalog: first **6 careers** (4–6 steps each) and **25–35 resources**. Open every URL in a browser, confirm title, provider, and suitability, then set `verifiedAt`. Replace all seed data. | P0 | 3 h | T1.1 | Release integrity test passes with `CATALOG_SEED` unset. |
| T1.5 | `scripts/check-links.ts`: GET each URL (follow redirects, 10 s timeout, browser-like UA, concurrency 4), report non-2xx, final URLs that changed domain, and timeouts; exit non-zero on failure. | P0 | 0.5 h | T1.2 | Script reports results for the seed catalog. |

T1.4 can run in parallel with Phases 2–4. It must be finished before Phase 5.

## Phase 2 — Deterministic engine (~2 h)

| ID | Task | Pri | Est | Deps | Done when |
|---|---|---|---|---|---|
| T2.1 | `lib/engine/normalize.ts` and `keywords.ts` (synonyms for every tag). | P0 | 0.5 h | T1.1 | Unit tests U-ENG-1 to U-ENG-3. |
| T2.2 | `lib/engine/recommend.ts`: scoring, top 3, tie-break, diverse default, reason templates. | P0 | 0.75 h | T2.1, T1.2 | U-ENG-4 to U-ENG-9. |
| T2.3 | `lib/engine/roadmap.ts`: ordered steps with hydrated resources. | P0 | 0.25 h | T1.2 | U-ENG-10, U-ENG-11. |
| T2.4 | Engine unit tests. | P0 | 0.5 h | T2.2, T2.3 | Green. |

## Phase 3 — Hardened API (~3 h)

| ID | Task | Pri | Est | Deps | Done when |
|---|---|---|---|---|---|
| T3.1 | `lib/api/readJsonBody.ts`: streaming read with 4,096-byte cap, fatal UTF-8 decoding, JSON parse; typed errors. | P0 | 0.5 h | T0.1 | U-API-1 to U-API-5. |
| T3.2 | `lib/api/rateLimit.ts` (interface + in-memory sliding window, injectable clock) and `guard.ts` (same-origin, content type, rate limit, IP extraction). | P0 | 0.75 h | T0.1 | U-API-6 to U-API-10. |
| T3.3 | `lib/api/responses.ts`: success/error helpers, `Cache-Control: no-store`, response-schema check, structured log line without user text. | P0 | 0.25 h | T1.1 | Unit tests. |
| T3.4 | `app/api/recommend/route.ts` and `app/api/roadmap/route.ts`, wiring guard → body → schema → engine → response schema. | P0 | 0.75 h | T2.*, T3.1–T3.3 | Route tests U-RT-* pass; `curl` works locally. |
| T3.5 | Route handler tests U-RT-1 to U-RT-9. | P0 | 0.75 h | T3.4 | Green. |

## Phase 4 — UI (~4.5 h)

| ID | Task | Pri | Est | Deps | Done when |
|---|---|---|---|---|---|
| T4.1 | `lib/client/apiClient.ts`: typed fetch, abort signal, 10 s timeout, error mapping (incl. 429). | P0 | 0.5 h | T1.1 | Unit tests. |
| T4.2 | `ExploreFlow` reducer and state machine with `inputVersion`, abort handling, and per-version roadmap cache (ARCHITECTURE §7.2). Reducer is a separate pure module. | P0 | 1 h | T4.1 | U-CL-1 to U-CL-7. |
| T4.3 | `layout.tsx` with header and footer (disclaimer + data-use notice). | P0 | 0.25 h | T0.1 | FR-21. |
| T4.4 | `InterestForm` + `InterestChips` (toggle buttons, `aria-pressed`), validation, privacy hint. | P0 | 0.75 h | T4.2 | FR-1 to FR-4. |
| T4.5 | `CareerList` + `CareerCard`, back to input with draft preserved. | P0 | 0.5 h | T4.2 | FR-5 to FR-9. |
| T4.6 | `RoadmapView` + `RoadmapStep` + `ResourceLink`, back to careers using the cache. | P0 | 0.75 h | T4.2 | FR-11 to FR-17. |
| T4.7 | `LoadingState` (`aria-live`), `ErrorMessage` with retry, focus management, 360 px layout pass. | P0 | 0.75 h | T4.4–T4.6 | Manual M-A11Y checks pass locally. |

## Phase 5 — Release (~3 h, includes both release requirements)

| ID | Task | Pri | Est | Deps | Done when |
|---|---|---|---|---|---|
| T5.1 | Playwright suite E2E-1 to E2E-10 (TEST_PLAN §2.6), configurable `PLAYWRIGHT_BASE_URL`. | P0 | 1 h | Phase 4 | Green locally. |
| T5.2 | `scripts/check-bundle.ts`: fail if `.next/static` contains `server-only` module markers, catalog-loader code, or any `AI_`/`API_KEY` env names. | P0 | 0.25 h | Phase 4 | Passes. |
| T5.3 | Configure the Vercel Firewall rate-limit rule on `/api/*`, set production env (`AI_PROVIDER=none`, `APP_ORIGIN`), enable spend alerts. | P0 | 0.25 h | T0.2 | Rule visible in dashboard; documented in README. |
| T5.4 **[H]** | **Resource verification gate:** run `check-links` (0 failures), re-open any resource with `verifiedAt` older than 14 days, update dates, commit. | P0 | 0.5 h | T1.4, T1.5 | AC-6 met. |
| T5.5 **[H]** | **Deployment gate:** deploy `main` to production; run Playwright against the production URL; run the manual release checklist (TEST_PLAN §3.1–3.3); record results in `docs/RELEASE_CHECKLIST.md` (created at release time). | P0 | 0.75 h | T5.1–T5.4 | AC-7 met. |
| T5.6 | `README.md`: purpose, setup, scripts, catalog mode, data-use summary, how to update and verify the catalog, AI gate pointer. | P0 | 0.25 h | — | New developer can run it. |

### ✂ MVP release line. Everything above must be done; everything below is optional.

## Phase 5b — Should-have (if time remains before release)

| ID | Task | Pri | Est | Deps |
|---|---|---|---|---|
| T5b.1 | "See all careers" list (FR-8). | P1 | 0.5 h | T4.5 |
| T5b.2 **[H]** | Careers 7–8 (aerospace engineer, mechanical engineer), staying within 35 resources. | P1 | 1 h | T1.4 |
| T5b.3 | "Verified <month year>" label on resources (FR-17). | P1 | 0.25 h | T4.6 |
| T5b.4 | GitHub Action: lint, typecheck, unit tests on push; weekly `check-links`. | P1 | 0.5 h | T1.5 |

## Phase 6 — AI personalization (post-MVP, gated)

Do not start until the MVP is released. Do not enable in any public environment until the gate record (ARCHITECTURE §10.1) is complete.

| ID | Task | Est | Deps |
|---|---|---|---|
| T6.0 **[H]** | Complete the gate record: provider and model, audience-eligibility review, data-use review, durable limiter, spend cap. | 1 h | MVP released |
| T6.1 | `lib/ai/provider.ts` (`AiProvider`, `NoneProvider`, factory from `AI_PROVIDER`) and `redact.ts`. | 0.5 h | — |
| T6.2 | `lib/ai/personalize.ts`: one bounded call, output schema, ID-subset check, URL stripping, per-item curated fallback. | 1 h | T6.1 |
| T6.3 | Provider adapter for the provider chosen in T6.0 (e.g. `providers/gemini.ts`). | 0.75 h | T6.1, T6.0 |
| T6.4 | Wire personalization into both routes; `personalization` field; "Personalized with AI" label. | 0.5 h | T6.2 |
| T6.5 | AI tests U-AI-1 to U-AI-12 (provider mocked); manual M-AI checks against the real provider in a protected preview. | 1 h | T6.4 |
| T6.6 | Update the footer data-use notice; enable in production only after T6.0–T6.5. | 0.25 h | T6.5 |

---

## Suggested schedule

| Block | Tasks |
|---|---|
| Day 1 AM | Phase 0, T1.1–T1.3, T1.5 |
| Day 1 PM | Phase 2, Phase 3 (API works via `curl` on seed data) · start T1.4 |
| Day 1 evening | T1.4 catalog authoring and verification |
| Day 2 AM | Phase 4 (full journey in browser) |
| Day 2 PM | Phase 5 (release gates) → MVP released |
| Remaining | Phase 5b; Phase 6 only after the gate |

## Critical path

`T0.1 → T1.1 → T1.2 → T2.2 → T3.4 → T4.2 → T4.6 → T5.1 → T5.5`, with `T1.4 → T5.4 → T5.5` as the human-content path.

If the schedule slips, cut in this order: Phase 5b → reduce to exactly 6 careers and 25 resources → simplify styling. **Never cut** T5.4 or T5.5.

## Notes for coding agents
- Tasks marked **[H]** need a human: the agent may draft catalog text but must **not** invent or guess resource URLs. Leave `url` and `verifiedAt` for human verification, or use clearly marked `example.com` seed data that the release test rejects.
- Do not add an AI SDK, database, auth, or client storage during Phases 0–5.
