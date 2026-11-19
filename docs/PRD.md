# STEMBridge AI — Product Requirements Document (PRD)

Status: Draft v2 (revised after architecture review) · Scope: 48-hour MVP · Owner: solo developer
Source: [PROJECT_BRIEF.md](PROJECT_BRIEF.md) · Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [TASKS.md](TASKS.md) · [TEST_PLAN.md](TEST_PLAN.md)

## 1. Problem

Students interested in STEM often don't know which careers match their interests, what those careers involve, or what to learn first. Generic search results are noisy, and AI chatbots can invent courses and links that don't exist.

## 2. Product summary

STEMBridge AI is a single web app where a student:

1. describes their interests,
2. gets a short list of matching STEM careers with reasons,
3. picks one career,
4. sees a step-by-step learning roadmap for that career,
5. opens **curated, human-verified** learning resources for each step.

Careers, roadmap steps, and resource mappings come from a **curated catalog** in the repository. They are authoritative. The MVP runs in **deterministic catalog mode**: matching and explanations are rule-based, so the product works with no AI provider at all.

An optional AI layer can later personalize *wording* (career reasons and step descriptions). It cannot change which careers, steps, or resources are shown. It stays **disabled** until a provider is chosen and confirmed to be eligible for the app's audience (see §6).

### 2.1 Deviation from the brief

The brief lists the Google Gemini API as a technology. The review found that we cannot assume Gemini (or any LLM provider) permits use by an audience that may include minors. So:

- The MVP ships without calling any LLM.
- The architecture is provider-independent: Gemini is one possible adapter, not a dependency.
- AI personalization is enabled only after the AI enablement gate (§6) is passed and recorded.

"AI-powered" in the brief is met by the AI personalization layer once enabled. Until then, the product delivers the full user journey with curated content.

## 3. Target users and personas

| Persona | Description | Need |
|---|---|---|
| **High-school explorer** (primary) | Around 14–18, curious about STEM, unsure of options | "What careers fit what I like, and where do I start?" |
| **Early undergrad / career switcher** (secondary) | Some background, wants direction | "What should I learn next, in what order, from where?" |

The audience is likely to include minors. The design assumes this throughout: no accounts, no stored personal data, no third-party data sharing in the MVP.

Usage assumptions: desktop or mobile browser, no account, the flow is completed in one sitting (about 3–5 minutes).

## 4. Goals and non-goals

### Goals (MVP)
- G1. A student can complete *interests → careers → select → roadmap → resources* on a public URL.
- G2. Every career, step, and resource link shown comes from the curated catalog, and every resource URL was verified before release.
- G3. The full journey works with no AI provider configured.
- G4. The public API is protected against oversized, malformed, cross-site, and high-volume requests.
- G5. No student input is stored or sent to third parties in the MVP.

### Non-goals (MVP)
- User accounts, authentication, saved profiles, databases, or persistence across page reloads.
- Follow-up chat or open-ended Q&A.
- Secondary-model failover or multi-provider routing.
- AI-generated careers, steps, or resources.
- Education-level tailoring, progress tracking, multi-language support, catalog admin UI.
- Advanced visual design.

## 5. Functional requirements

Priority: **P0** = must ship, **P1** = should ship if time permits. Items marked **[AI]** apply only after the AI enablement gate.

### 5.1 Interest input
| ID | Requirement | Pri |
|---|---|---|
| FR-1 | The student can enter interests as free text (1–300 characters after trimming). | P0 |
| FR-2 | The student can choose quick-pick interest chips (e.g. "Robots", "Coding", "Space", "Biology", "Environment", "Building things", "Health", "Data & math"). Selected chips are sent as structured tags, separate from the free text. | P0 |
| FR-3 | Submission requires free text or at least one chip. Otherwise a clear validation message is shown. | P0 |
| FR-4 | A hint under the input says: "Describe what you enjoy. Don't include your name or other personal details." | P0 |

### 5.2 Career recommendations
| ID | Requirement | Pri |
|---|---|---|
| FR-5 | The system returns the **top 3** careers from the catalog of 6–8, ranked by deterministic tag matching. | P0 |
| FR-6 | Each career card shows title, a one-sentence summary, a "why this fits you" reason, and 3–5 key skills. | P0 |
| FR-7 | In catalog mode, the reason is generated from the matched interest tags (e.g. "Matches your interest in robots and coding."). If nothing matches, a diverse default set is returned with a generic reason. | P0 |
| FR-8 | A "See all careers" option lists every catalog career, so the student isn't limited by matching quality. | P1 |
| FR-9 | The student can go back and edit interests. Their previous input is preserved. | P0 |
| FR-10 [AI] | The AI may rewrite the reason text for the 3 selected careers. It cannot add, remove, or reorder careers. | — |

### 5.3 Roadmap
| ID | Requirement | Pri |
|---|---|---|
| FR-11 | Selecting a career shows its curated roadmap: **4–6 ordered steps**, each with title, description (≤ 60 words), skills, estimated duration, and 1–3 resources. | P0 |
| FR-12 | Roadmap steps, their order, and their resource mappings come only from the catalog. | P0 |
| FR-13 | The student can return to the career list and choose a different career without re-entering interests. | P0 |
| FR-14 [AI] | The AI may rewrite each step's description to relate it to the student's interests. Step titles, order, durations, skills, and resources stay curated. | — |

### 5.4 Resources
| ID | Requirement | Pri |
|---|---|---|
| FR-15 | Each resource shows title, provider, type (course / video / article / interactive / book), cost (free / freemium / paid), and opens in a new tab. | P0 |
| FR-16 | Resources are reusable across careers and steps. The catalog holds **25–35** resources. | P0 |
| FR-17 | Each resource shows "Verified <month year>" from its catalog `verifiedAt` date. | P1 |

### 5.5 Correctness and feedback
| ID | Requirement | Pri |
|---|---|---|
| FR-18 | Loading states are shown during every request. | P0 |
| FR-19 | If interests change (edit and resubmit, or go back and resubmit), results from earlier in-flight requests are never displayed. Only the latest request for the current input can update the screen. | P0 |
| FR-20 | Network or server errors show a friendly message with a retry button. | P0 |
| FR-21 | The footer has a disclaimer ("Guidance only. Talk with a teacher or counselor.") and a short data-use notice (§7). | P0 |
| FR-22 [AI] | When AI personalization is enabled and succeeds, a small "Personalized with AI" label is shown. If it fails, curated text is shown with no error. | — |

## 6. AI enablement gate

AI personalization stays off (`AI_PROVIDER=none`) in every environment until **all** of the following are recorded in [ARCHITECTURE.md §10](ARCHITECTURE.md#10-ai-enablement-gate-and-optional-provider-adapter):

1. **Audience eligibility:** the chosen provider's current terms permit use by this app's audience, including users under 18, or the app adds an age restriction that satisfies them.
2. **Data use:** the provider's terms for the chosen tier on training, retention, and human review of prompts are acceptable, and the data-use notice is updated.
3. **Abuse protection:** a durable (not per-instance) rate limit and a hard provider spend or quota cap are in place.
4. **Tests:** AI-mode tests (TEST_PLAN §2.5) pass with the provider mocked, and the manual AI checks (TEST_PLAN §3.4) pass against the real provider.

The MVP release does **not** depend on passing this gate.

## 7. Data use (MVP)

- Interests text and chips are processed in memory to produce a response. They are **not stored**, logged, or sent to any third party.
- No cookies, analytics, tracking, or accounts. No client-side persistence: reloading the page starts over.
- Server logs record only route, status, latency, and result counts. The hosting platform may keep standard request logs (including IP addresses) for a limited time. The notice says so.
- When AI is enabled later, the notice must state that interests text is sent to the named provider for personalization, and inputs must have obvious personal data (emails, phone numbers) redacted before sending.

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Provider independence:** no AI SDK is required to build, test, or run the MVP. Provider secrets (when they exist) are server-only. |
| NFR-2 | **Performance:** p95 API response ≤ 500 ms in catalog mode. When AI is enabled: one AI request per operation, bounded by an 8 s timeout. |
| NFR-3 | **API hardening:** request bodies limited by actual bytes read (4 KB), JSON content type required, strict schemas (unknown fields rejected), same-origin check on POST, per-IP rate limiting. |
| NFR-4 | **Accessibility:** keyboard-navigable, labelled controls, visible focus, sufficient contrast, loading announced to screen readers. |
| NFR-5 | **Responsive:** usable at 360 px width and up. |
| NFR-6 | **Privacy:** per §7. |
| NFR-7 | **Maintainability:** catalog in typed data files, validated by automated integrity tests. |

## 9. User stories

| ID | Story | Maps to |
|---|---|---|
| US-1 | As a student, I want to describe what I enjoy and pick interest chips so that the recommendations reflect me. | FR-1–FR-4 |
| US-2 | As a student, I want three careers with reasons tied to my interests so that I understand why they were suggested. | FR-5–FR-7 |
| US-3 | As a student, I want to choose a career and see an ordered plan so that I know what to learn first. | FR-11, FR-12 |
| US-4 | As a student, I want each step to link to trustworthy resources so that I can start learning right away. | FR-15–FR-17 |
| US-5 | As a student, I want to go back and compare careers or change my interests without seeing outdated results. | FR-9, FR-13, FR-19 |
| US-6 | As a student (and parent or teacher), I want to know my input isn't stored or shared. | FR-4, FR-21, §7 |
| US-7 | As the developer, I want the public API to reject abusive or malformed traffic so that the deployment stays available. | NFR-3 |
| US-8 | As the developer, I want catalog integrity and link health checked before release so that no broken or invented resources ship. | NFR-7, §10 |
| US-9 [AI] | As a student, I want explanations that relate to my specific interests, with curated steps and links unchanged. | FR-10, FR-14, FR-22 |

## 10. MVP acceptance criteria

The MVP is accepted when **every criterion below passes on the public production deployment**. AC-1 to AC-5 cover functionality. AC-6 and AC-7 are release requirements.

### AC-1 Core journey (US-1 to US-4)
- **Given** I open the production URL, **when** I type "I like building robots and coding" and submit, **then** within 2 s I see exactly 3 career cards, each with title, summary, reason, and skills, and "Robotics Engineer" is among them.
- **When** I select a career, **then** I see its curated roadmap of 4–6 ordered steps, each with duration and 1–3 resources.
- **When** I click a resource, **then** its catalog URL opens in a new tab.
- Selecting only the "Space" chip (no text) also returns 3 careers.

### AC-2 Navigation and freshness (US-5)
- From the roadmap I can return to the same career list without a new request, then open a different career's roadmap.
- From the career list I can return to the input with my text and chips preserved.
- If I submit interests A, go back, change to interests B, and submit before A's response arrives, only B's results are ever shown.

### AC-3 Catalog authority (G2)
- The catalog has 6–8 careers, 25–35 resources, and 4–6 steps per career, all passing integrity tests.
- Every URL in the UI matches a URL in the resource catalog. No component renders a URL from any other source.

### AC-4 API hardening (US-7)
- A request body over 4 KB is rejected with 413, including when the `Content-Length` header is missing or understated.
- Non-JSON content type → 415. Malformed JSON, unknown fields, wrong types, or out-of-range lengths → 400.
- A cross-origin POST (mismatched `Origin`) → 403.
- More requests than the per-IP limit → 429 with a `Retry-After` header. The UI shows a friendly "please wait" message.
- Error responses contain no stack traces or internal details.

### AC-5 Privacy and provider independence (US-6, NFR-1)
- The production deployment runs with `AI_PROVIDER=none` and makes no outbound AI requests.
- No cookies are set, `localStorage`/`sessionStorage` are not used, and server logs contain no interests text.
- The footer shows the disclaimer and data-use notice.

### AC-6 Release requirement: resource verification
- `npm run check-links` reports 0 failures against the production catalog.
- Every resource has a `verifiedAt` date within **14 days** of the release date, set after a human opened the page and confirmed that title, provider, and content match the catalog entry and are suitable for students.

### AC-7 Release requirement: end-to-end deployment
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
- The Playwright suite passes locally **and** against the production URL (`PLAYWRIGHT_BASE_URL`).
- The manual release checklist (TEST_PLAN §3) passes on production, including a 360 px mobile viewport and a keyboard-only run.

## 11. Success metrics (informal)
- A first-time user completes the journey in under 5 minutes without help.
- 0 broken resource links at release.
- Server logs show no 5xx errors during the release check.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| LLM provider terms exclude minors or have unsuitable data use | MVP needs no provider. AI is gated (§6). The provider adapter is replaceable. |
| AI invents careers, steps, or links | AI can only rewrite text for IDs the server supplies. Output is schema-validated, URLs are stripped, and curated text is the fallback. |
| Deterministic matching feels generic | Synonym-rich keyword map, chips as structured tags, "See all careers" option. |
| Small catalog limits coverage | 6–8 careers chosen across fields; resources reused across careers. |
| Public API abuse | Byte-limited bodies, strict schemas, origin check, per-IP rate limit, platform firewall rule. No costly downstream calls in catalog mode. |
| Stale responses after the user changes input | Request versioning and aborting on the client (ARCHITECTURE §7.2). |
| Link rot before release | Link check plus manual verification as release requirements (AC-6). |
| 48-hour overrun | Deterministic journey first; AI layer is outside the MVP release; P1 items can be cut. |
