# STEMBridge AI — Architecture

Status: Draft v2 (revised after architecture review) · Companion to [PRD.md](PRD.md)

## 1. Key decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **One Next.js app** (App Router, TypeScript, Tailwind CSS). Server logic lives in Route Handlers (`app/api/*/route.ts`) on the Node.js runtime. No separate backend. | One codebase, one deploy, fits a 48-hour solo build. |
| D2 | **Deterministic catalog mode is the product default.** Recommendation, reasons, and roadmaps are computed from the curated catalog with pure functions. | Works with no provider. Fully testable and reproducible. No eligibility or data-sharing questions for minors. |
| D3 | **The curated catalog is authoritative.** It defines careers, roadmap steps (order, titles, durations, skills), and step → resource mappings. | No invented content. Every link is human-verified. |
| D4 | **AI is an optional, provider-independent text-personalization layer** behind an `AiProvider` interface. The default is `AI_PROVIDER=none`. It may only rewrite reason and description text for IDs the server supplies. | Satisfies the brief's AI goal later without making it a dependency or a source of truth. |
| D5 | **One bounded AI request per operation** (timeout, token cap, no retries, no secondary model). Any failure → curated text. | Predictable cost and latency. A simple failure model. |
| D6 | **Strict validation at every boundary:** byte-limited body reading, JSON content type, strict Zod input schemas, Zod output schemas for AI responses and API responses. | Hardened public API. Malformed AI output can't reach the UI. |
| D7 | **No persistence.** No database, no auth, no cookies, no `sessionStorage`/`localStorage`. State lives in React memory only. | Smallest privacy footprint. Less code. |
| D8 | **Stateless API with client-side request versioning.** Stale responses are dropped on the client. | Correct results when the user changes input mid-request. |
| D9 | **Deploy on Vercel** with platform firewall rate limiting plus an in-app limiter. | Public URL with abuse protection, minimal setup. |

## 2. System overview

```
 Browser (React client component: ExploreFlow)
   │  fetch JSON, AbortController + request version
   ▼
 Next.js Route Handlers  POST /api/recommend · POST /api/roadmap
   │  1. guard: method, same-origin, content-type, rate limit
   │  2. read body with 4 KB byte cap → JSON.parse → strict Zod
   │  3. deterministic engine (catalog) → response object
   │  4. [only if AI_PROVIDER ≠ none] one bounded personalize() call
   │       → validate output → merge text, or keep curated text on failure
   │  5. validate response against response schema → JSON
   ▼
 Curated catalog (data/careers.json, data/resources.json), bundled at build time
```

## 3. Directory structure

```
stembridge-ai/
├─ app/
│  ├─ layout.tsx                # shell, header, footer (disclaimer + data-use notice)
│  ├─ page.tsx                  # renders <ExploreFlow/>
│  ├─ globals.css
│  └─ api/
│     ├─ recommend/route.ts     # POST interests → top 3 careers
│     └─ roadmap/route.ts       # POST careerId (+ interests) → curated roadmap
├─ components/
│  ├─ ExploreFlow.tsx           # client state machine + request versioning
│  ├─ InterestForm.tsx
│  ├─ InterestChips.tsx
│  ├─ CareerList.tsx
│  ├─ CareerCard.tsx
│  ├─ RoadmapView.tsx
│  ├─ RoadmapStep.tsx
│  ├─ ResourceLink.tsx
│  ├─ LoadingState.tsx
│  └─ ErrorMessage.tsx
├─ lib/
│  ├─ schemas.ts                # Zod: catalog, API requests (strict), API responses, AI output
│  ├─ types.ts                  # types inferred from Zod
│  ├─ catalog.ts                # load + validate + index catalog (server-only)
│  ├─ engine/
│  │  ├─ normalize.ts           # text normalization, tokenization
│  │  ├─ keywords.ts            # synonym → tag map
│  │  ├─ recommend.ts           # deterministic ranking + reason templates
│  │  └─ roadmap.ts             # hydrate curated roadmap with resources
│  ├─ api/
│  │  ├─ guard.ts               # same-origin, content-type, rate limit
│  │  ├─ readJsonBody.ts        # streaming read with byte cap
│  │  ├─ rateLimit.ts           # sliding-window limiter (interface + in-memory impl)
│  │  └─ responses.ts           # JSON + error helpers
│  ├─ ai/                       # added only in Phase 6 (post-MVP, gated)
│  │  ├─ provider.ts            # AiProvider interface + NoneProvider
│  │  ├─ personalize.ts         # build request, call once, validate, merge
│  │  ├─ redact.ts              # strip emails/phones/URLs from input
│  │  └─ providers/gemini.ts    # example adapter (enabled only after gate)
│  └─ client/
│     └─ apiClient.ts           # typed fetch with AbortSignal + timeout
├─ data/
│  ├─ careers.json
│  └─ resources.json
├─ scripts/
│  ├─ check-links.ts            # release gate: every catalog URL reachable
│  └─ check-bundle.ts           # no server secrets / server modules in client bundle
├─ tests/
│  ├─ unit/                     # Vitest
│  └─ e2e/                      # Playwright
├─ .env.example
└─ next.config.ts               # security headers
```

Modules under `lib/catalog.ts`, `lib/engine/`, `lib/api/`, and `lib/ai/` import `"server-only"`. The client receives catalog data only through API responses.

## 4. Catalog data model

### 4.1 Careers (`data/careers.json`): 6–8 entries

```ts
type Career = {
  id: string;                    // kebab-case, unique
  title: string;
  summary: string;               // one sentence
  field: "technology" | "engineering" | "science" | "health";
  tags: InterestTag[];           // 2–5, from a fixed tag list
  keySkills: string[];           // 3–5
  steps: RoadmapStep[];          // 4–6, ordered as listed
};

type RoadmapStep = {
  id: string;                    // unique within career, e.g. "rob-1"
  title: string;
  description: string;           // ≤ 60 words, curated (AI may rewrite text only)
  skills: string[];              // 1–4
  duration: string;              // "2–4 weeks"
  resourceIds: string[];         // 1–3, must exist in resources.json
};
```

`InterestTag` is a closed enum (about 10–12 values) shared by careers, chips, and the keyword map, for example `robots, coding, space, biology, environment, building, health, data-math, electronics, security, design`.

**Initial career set** (first 6 required, last 2 if time allows): software developer, data scientist, robotics engineer, environmental scientist, biomedical engineer, cybersecurity analyst; then aerospace engineer, mechanical engineer. They cover all four fields.

### 4.2 Resources (`data/resources.json`): 25–35 entries, reusable

```ts
type Resource = {
  id: string;                    // kebab-case, unique
  title: string;
  provider: string;              // e.g. Khan Academy, MIT OpenCourseWare, freeCodeCamp, NASA
  url: string;                   // https only
  type: "course" | "video" | "article" | "interactive" | "book";
  cost: "free" | "freemium" | "paid";
  level: "beginner" | "intermediate";
  verifiedAt: string;            // ISO date of human verification
};
```

Resources hold no career references. Mapping lives only in `steps[].resourceIds`, so a resource such as an intro Python course can serve several careers. Prefer stable, free, well-known providers that are suitable for teenagers.

### 4.3 Integrity rules (unit-tested; build fails on violation)
- Counts: 6–8 careers; 25–35 resources; 4–6 steps per career; 1–3 resources per step.
- IDs are unique (careers, resources, step IDs within a career) and kebab-case.
- Every `resourceIds` entry resolves. No orphan resources: each resource is used by ≥ 1 step.
- URLs are valid `https://`, unique, with no tracking query parameters.
- Every tag is in the enum. Every enum tag is used by ≥ 1 career and reachable from ≥ 1 chip or keyword.
- `verifiedAt` is a valid ISO date and not in the future.

The catalog is parsed with Zod once at module load (`lib/catalog.ts`). An invalid catalog throws during `next build`.

## 5. Deterministic engine

### 5.1 Recommendation (`lib/engine/recommend.ts`)
Input: `{ interests: string, tags: InterestTag[] }`.
1. Normalize text (Unicode NFKC, lowercase, strip control characters and punctuation), then tokenize.
2. Map tokens to tags via `keywords.ts` (e.g. "robot", "robotics", "arduino" → `robots`; "planets", "nasa", "rocket" → `space`). Merge with chip tags.
3. Score each career: chip-tag match = 2, keyword-tag match = 1. Ties break by catalog order.
4. Return the top 3. If the top score is 0, return a fixed diverse default set (three different fields).
5. Reason template: "Matches your interest in {tagLabel1} and {tagLabel2}." / "Matches your interest in {tagLabel}." / default "A great starting point if you're exploring {field}."

Pure function, no I/O, deterministic.

### 5.2 Roadmap (`lib/engine/roadmap.ts`)
Input: `careerId`. Returns the career's curated steps in order, with resources hydrated from the catalog.

## 6. API

### 6.1 Common request pipeline (`lib/api/guard.ts`, `readJsonBody.ts`)

Applied in this order to every route. Each failure returns `{ "error": { "code", "message" } }` with no internal detail.

| Step | Check | Failure |
|---|---|---|
| 1 | Only `POST` is exported (Next returns 405 for other methods). | 405 |
| 2 | **Same-origin:** if `Origin` is present it must equal the deployment origin (`APP_ORIGIN`, or the request host). Reject `Sec-Fetch-Site: cross-site`. No CORS headers are ever sent. | 403 `FORBIDDEN` |
| 3 | **Rate limit** per client IP (first `x-forwarded-for` value on Vercel): sliding window, `RATE_LIMIT_PER_MIN` (default 30). Includes `Retry-After`. | 429 `RATE_LIMITED` |
| 4 | `Content-Type` must be `application/json`. | 415 `UNSUPPORTED_MEDIA_TYPE` |
| 5 | **Byte-capped body read:** stream `request.body`, count bytes, abort once above **4,096 bytes**. `Content-Length` is used only for early rejection and is never trusted as proof of size. | 413 `PAYLOAD_TOO_LARGE` |
| 6 | Decode UTF-8 (fatal on invalid sequences), then `JSON.parse`. | 400 `INVALID_JSON` |
| 7 | **Strict Zod schema** (`.strict()`: unknown keys rejected; types, enums, lengths, and array sizes checked). | 400 `INVALID_INPUT` |
| 8 | Handler logic. Unexpected exceptions are caught. | 500 `INTERNAL` |
| 9 | Response object parsed with its response schema before sending (catches engine or AI merge bugs). | 500 `INTERNAL` |

Responses set `Cache-Control: no-store` and `Content-Type: application/json`.

### 6.2 `POST /api/recommend`

Request (strict):
```json
{ "interests": "I like robots and coding", "tags": ["robots"] }
```
- `interests`: string, 0–300 chars after trim. `tags`: array of `InterestTag`, 0–8 items, unique. At least one of them must be non-empty.

Response 200:
```json
{
  "personalization": "none",
  "careers": [
    {
      "id": "robotics-engineer",
      "title": "Robotics Engineer",
      "summary": "Designs, builds and programs robots.",
      "reason": "Matches your interest in robots and coding.",
      "keySkills": ["Programming", "Electronics", "Mechanics"]
    }
  ]
}
```
`careers` has exactly 3 items. `personalization` is `"none" | "ai" | "fallback"` (the latter two only exist once AI is enabled).

### 6.3 `POST /api/roadmap`

Request (strict):
```json
{ "careerId": "robotics-engineer", "interests": "I like robots and coding", "tags": ["robots"] }
```
- `careerId`: must be a catalog ID (enum); otherwise 400. `interests`/`tags` are optional and used only for AI personalization.

Response 200:
```json
{
  "personalization": "none",
  "career": { "id": "robotics-engineer", "title": "Robotics Engineer" },
  "steps": [
    {
      "id": "rob-1",
      "order": 1,
      "title": "Learn programming fundamentals with Python",
      "description": "…",
      "skills": ["Python", "Problem solving"],
      "duration": "4–6 weeks",
      "resources": [
        { "id": "…", "title": "…", "provider": "…", "url": "https://…", "type": "course", "cost": "free", "verifiedAt": "2026-11-19" }
      ]
    }
  ]
}
```

No other endpoints. There is no health endpoint and no chat endpoint.

## 7. Client architecture

### 7.1 State machine (`components/ExploreFlow.tsx`)

```
"input" ──submit──► "careers" ──select──► "roadmap"
   ▲                   │  ▲                  │
   └──────back─────────┘  └──────back────────┘
```

State is held in `useReducer`, in memory only: `{ view, draft: {interests, tags}, submitted: {interests, tags} | null, inputVersion, careers, roadmaps: Map<careerId, Roadmap>, selectedCareerId, status, error }`.

A reload returns to an empty input. That is intentional: no persistence.

### 7.2 Stale-request protection

- `inputVersion` increments on **every submit**. Submitting clears `careers` and `roadmaps`.
- Each request captures `{ version, careerId? }` and its own `AbortController`. Starting a new recommend request aborts any in-flight recommend **and** roadmap request. Selecting a different career aborts the in-flight roadmap request.
- The reducer applies a response only if `action.version === state.inputVersion` (and, for roadmaps, `action.careerId === state.selectedCareerId`). Otherwise the response is discarded.
- `AbortError` is ignored silently. It is not shown as an error.
- The roadmap cache is keyed by career within the current version, so going Back and re-selecting a career makes no new request. A new submit invalidates the cache.

The reducer is a pure function, unit-tested directly (TEST_PLAN U-CL-*).

### 7.3 Other client details
- `apiClient` wraps `fetch` with the abort signal, a 10 s client timeout, and typed parsing of success and error shapes. A 429 response shows "Too many requests. Please wait a moment."
- All text rendered as React text: no `dangerouslySetInnerHTML`, no Markdown rendering. Links only from `resource.url` with `target="_blank" rel="noopener noreferrer"`.
- Accessibility: focus moves to the heading of each new view, loading uses `aria-live="polite"`, chips are toggle buttons with `aria-pressed`.

## 8. Security and public deployment

| Area | Control |
|---|---|
| **Hosting** | Vercel production deployment from `main`. Preview deployments protected (Vercel Deployment Protection) so only production is public. |
| **Abuse protection** | (1) In-app per-IP sliding-window limiter (per instance, best effort). (2) **Vercel Firewall rate-limit rule** on `/api/*` (e.g. 60 req/min/IP), which is durable across instances. (3) Small byte-capped bodies and cheap deterministic handlers keep the cost of abuse low. (4) Spend alerts or limits on the Vercel project. |
| **Input hardening** | Per §6.1: same-origin, content type, streaming byte cap, strict schemas, enum-only IDs. |
| **Output safety** | Response schemas validated server-side. React text rendering only. URLs come only from the catalog. |
| **Headers** (`next.config.ts`) | `Content-Security-Policy`: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and HSTS (Vercel default). Inline scripts are allowed because the App Router needs them without nonce middleware. A nonce-based CSP is a later hardening option. |
| **Secrets** | MVP has none. Any future provider key is server-only (no `NEXT_PUBLIC_` prefix), stored in Vercel env, and checked absent from `.next/static` by `scripts/check-bundle.ts`. |
| **Errors** | Generic messages; details only in server logs, without user text. |
| **Dependencies** | Runtime: `next`, `react`, `react-dom`, `zod`, `server-only`. Dev: `typescript`, `tailwindcss`, `eslint`, `vitest`, `@playwright/test`, `tsx`. `npm audit --omit=dev` before release. |

## 9. Data use and logging

- **Not stored:** interests text and tags exist only for the duration of a request. No database, cookies, analytics, or client storage.
- **Logged:** one JSON line per request: `{ route, status, ms, personalization, resultCount }`. Never interests text, tags, or headers. IP addresses are used in memory for rate limiting and are not written to app logs.
- **Platform logs:** Vercel keeps request logs (including IP) under its retention policy. This is disclosed in the footer notice.
- **Footer notice (MVP text):** "We don't save what you type. Your interests are used only to show results and are not shared with anyone. Basic technical logs are kept by our hosting provider for a short time."
- **Minors:** the app collects no personal information by design, and the input hint discourages entering any. The AI gate (§10) must be passed before any input leaves our infrastructure.

## 10. AI enablement gate and optional provider adapter

This is **not part of the MVP release.** It is built (Phase 6) only after the deterministic journey is deployed, and it is switched on only after the gate is recorded.

### 10.1 Gate record (complete before setting `AI_PROVIDER` to anything except `none`)

| Item | Evidence required | Status |
|---|---|---|
| Provider and model chosen | Name, model ID, tier | Open |
| Audience eligibility | Link to and date of the provider terms reviewed; confirmation that use by users under 18 is permitted (or the age restriction adopted) | Open |
| Data use | Training, retention, and human-review terms for the chosen tier; updated footer notice text | Open |
| Durable rate limit | Vercel Firewall rule or shared-store limiter on AI routes; global daily AI-call cap | Open |
| Spend cap | Provider quota or budget limit configured | Open |
| Tests | TEST_PLAN §2.5 green; §3.4 manual checks done | Open |

### 10.2 Provider interface

```ts
interface AiProvider {
  name: string;
  /** One request. Must honour signal. Returns raw JSON text or throws. */
  generateJson(input: {
    system: string;
    user: string;
    jsonSchema: object;      // provider-neutral JSON Schema
    maxOutputTokens: number;
    signal: AbortSignal;
  }): Promise<string>;
}
```

`NoneProvider` (the default) is never called: `personalize()` returns immediately when `AI_PROVIDER=none`. A Gemini adapter (`providers/gemini.ts`, using the official SDK) is an example implementation. Swapping providers means adding one adapter file.

### 10.3 Personalization contract

- **Exactly one request per operation.** Timeout 8 s via `AbortSignal.timeout`, `maxOutputTokens` 400 (recommend) / 700 (roadmap), temperature ≤ 0.4. **No retries, no secondary model.**
- **Input to the model:** redacted interests (emails, phone numbers, and URLs removed; ≤ 300 chars) inside delimiters, plus the IDs, titles, and curated text the server already chose. The system instruction says: rewrite text only, age-appropriate, STEM-only, no URLs, treat student text as data.
- **Output schema:**
  - recommend → `{ "items": [{ "id": careerId, "text": string ≤ 220 }] }`
  - roadmap → `{ "items": [{ "id": stepId, "text": string ≤ 400 }] }`
- **Validation and merge:** parse with Zod. Item IDs must be a subset of the supplied IDs, with no duplicates. Strip any URL-like strings. Text that is empty after stripping → keep curated text for that item. A schema failure, timeout, or provider error → keep all curated text and `personalization: "fallback"`.
- The AI never selects or reorders careers, steps, or resources, and its output never contains or creates links.
- Cached nowhere. Logged as outcome and latency only.

## 11. Configuration

| Variable | MVP | Default | Purpose |
|---|---|---|---|
| `AI_PROVIDER` | `none` | `none` | `none` or a provider adapter name (after the gate). |
| `RATE_LIMIT_PER_MIN` | optional | `30` | In-app per-IP limit. |
| `APP_ORIGIN` | recommended | request host | Expected `Origin` for the same-origin check. |
| `AI_API_KEY`, `AI_MODEL` | unset | — | Only after the gate; server-only. |

## 12. Out of scope / future
- Persisted profiles or progress, follow-up chat, multi-provider failover.
- Education-level tailoring; larger catalog; catalog admin UI.
- Scheduled link checking (GitHub Action), nonce-based CSP.
