import { describe, expect, it } from "vitest";
import { exploreReducer, initialExploreState } from "../../lib/client/exploreReducer";
import type { Interests, RecommendResponse, RoadmapResponse } from "../../lib/types";

const draft: Interests = { interests: "I like robots", tags: ["robots"] };
const careers: RecommendResponse["careers"] = [{
  id: "robotics-engineer", title: "Robotics Engineer", summary: "Builds robots.",
  reason: "Matches your interest in robots.", keySkills: ["Programming", "Electronics", "Testing"],
}];
const roadmap: RoadmapResponse = { career: { id: "robotics-engineer", title: "Robotics Engineer" }, steps: [], personalization: "none" };

function submitted() {
  return exploreReducer(exploreReducer(initialExploreState(), { type: "edit", draft }), { type: "submit", input: draft, version: 1 });
}

function selected() {
  return exploreReducer(submitted(), { type: "select", careerId: "robotics-engineer" });
}

function loaded() {
  return exploreReducer(selected(), { type: "roadmapLoaded", version: 1, careerId: "robotics-engineer", roadmap });
}

describe("student flow reducer", () => {
  it("U-CL-1 invalidates an earlier recommendation and roadmap cache on submit", () => {
    const state = exploreReducer({ ...loaded(), careers }, { type: "submit", input: { interests: "weather", tags: [] }, version: 2 });
    expect(state).toMatchObject({ view: "careers", inputVersion: 2, careers: [], status: "loading", selectedCareerId: null });
    expect(state.roadmaps.size).toBe(0);
  });

  it("U-CL-2 ignores an old recommendation response", () => {
    const state = submitted();
    expect(exploreReducer(state, { type: "careersLoaded", version: 0, careers })).toBe(state);
  });

  it("tracks the latest version across rapid submissions and ignores a repeated version", () => {
    const later = { interests: "weather", tags: [] };
    const state = exploreReducer(submitted(), { type: "submit", input: later, version: 2 });
    expect(exploreReducer(state, { type: "submit", input: draft, version: 2 })).toBe(state);
    expect(exploreReducer(state, { type: "careersLoaded", version: 1, careers })).toBe(state);
    expect(exploreReducer(state, { type: "careersLoaded", version: 2, careers }).status).toBe("ready");
  });

  it("turns unexpected errors into student-safe copy", () => {
    const state = exploreReducer(submitted(), { type: "requestFailed", version: 1, error: new Error("internal details") });
    expect(state.error).toBe("Something went wrong. Please try again.");
  });

  it.each([
    ["U-CL-3 wrong career", 1, "software-engineer"],
    ["U-CL-4 old version", 0, "robotics-engineer"],
  ])("ignores a roadmap for %s", (_, version, careerId) => {
    const state = selected();
    expect(exploreReducer(state, { type: "roadmapLoaded", version, careerId, roadmap })).toBe(state);
  });

  it("U-CL-5 reuses a cached roadmap after going back", () => {
    const state = exploreReducer(loaded(), { type: "backToCareers" });
    const again = exploreReducer(state, { type: "select", careerId: "robotics-engineer" });
    expect(again.status).toBe("ready");
    expect(again.roadmaps.get("robotics-engineer")).toBe(roadmap);
  });

  it("U-CL-6 ignores cancellation", () => {
    const state = submitted();
    const error = new DOMException("Cancelled", "AbortError");
    expect(exploreReducer(state, { type: "requestFailed", version: 1, error })).toBe(state);
  });

  it("U-CL-7 preserves text and chips and ignores responses after going back", () => {
    const state = exploreReducer(submitted(), { type: "backToInput" });
    expect(state.draft).toEqual(draft);
    expect(exploreReducer(state, { type: "careersLoaded", version: 1, careers })).toBe(state);
  });
});
