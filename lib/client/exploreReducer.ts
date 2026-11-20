import type { Interests, RecommendResponse, RoadmapResponse } from "../types";
import { requestFailure } from "./apiClient";

type State = {
  view: "input" | "careers" | "roadmap";
  draft: Interests;
  submitted: Interests | null;
  inputVersion: number;
  careers: RecommendResponse["careers"];
  roadmaps: ReadonlyMap<string, RoadmapResponse>;
  selectedCareerId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  retryAt: number | null;
};

type Action =
  | { type: "edit"; draft: Interests }
  | { type: "submit"; input: Interests; version: number }
  | { type: "careersLoaded"; version: number; careers: State["careers"] }
  | { type: "select"; careerId: string }
  | { type: "roadmapLoaded"; version: number; careerId: string; roadmap: RoadmapResponse }
  | { type: "requestFailed"; version: number; careerId?: string; error: unknown }
  | { type: "cooldownEnded"; retryAt: number }
  | { type: "backToInput" }
  | { type: "backToCareers" };

export function initialExploreState(): State {
  return {
    view: "input", draft: { interests: "", tags: [] }, submitted: null, inputVersion: 0,
    careers: [], roadmaps: new Map(), selectedCareerId: null, status: "idle", error: null, retryAt: null,
  };
}

export function exploreReducer(state: State, action: Action): State {
  switch (action.type) {
    case "edit":
      return { ...state, draft: action.draft };
    case "submit":
      if (action.version <= state.inputVersion) return state;
      return {
        ...state, submitted: action.input, inputVersion: action.version, view: "careers",
        careers: [], roadmaps: new Map(), selectedCareerId: null, status: "loading", error: null,
      };
    case "careersLoaded":
      if (action.version !== state.inputVersion || state.view !== "careers") return state;
      return { ...state, careers: action.careers, status: "ready" };
    case "select":
      return {
        ...state, view: "roadmap", selectedCareerId: action.careerId, error: null,
        status: state.roadmaps.has(action.careerId) ? "ready" : "loading",
      };
    case "roadmapLoaded":
      if (action.version !== state.inputVersion || state.view !== "roadmap" || action.careerId !== state.selectedCareerId) return state;
      return { ...state, roadmaps: new Map(state.roadmaps).set(action.careerId, action.roadmap), status: "ready" };
    case "requestFailed": {
      if ((action.error instanceof Error && action.error.name === "AbortError") || action.version !== state.inputVersion) return state;
      if (action.careerId === undefined ? state.view !== "careers"
        : state.view !== "roadmap" || action.careerId !== state.selectedCareerId) return state;
      const failure = requestFailure(action.error);
      return { ...state, status: "error", error: failure.message, retryAt: failure.retryAt };
    }
    case "cooldownEnded":
      if (action.retryAt !== state.retryAt) return state;
      return { ...state, retryAt: null, error: state.status === "error" ? "You can try again now." : state.error };
    case "backToInput":
      return { ...state, view: "input", status: "idle", error: null, selectedCareerId: null };
    case "backToCareers":
      return { ...state, view: "careers", status: "ready", error: null, selectedCareerId: null };
  }
}
