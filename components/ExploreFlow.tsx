"use client";

import { useEffect, useReducer, useRef } from "react";
import { fetchRecommendations, fetchRoadmap } from "../lib/client/apiClient";
import { exploreReducer, initialExploreState } from "../lib/client/exploreReducer";
import type { Interests } from "../lib/types";
import { CareerList } from "./CareerList";
import { InterestForm } from "./InterestForm";
import { RoadmapView } from "./RoadmapView";

const viewLabel = { input: "Interests", careers: "Careers", roadmap: "Roadmap" } as const;

export function ExploreFlow({ seed }: { seed: boolean }) {
  const [state, dispatch] = useReducer(exploreReducer, undefined, initialExploreState);
  const inFlight = useRef<{ key: string; controller: AbortController } | null>(null);
  const versionRef = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(state.view);

  useEffect(() => {
    if (previousView.current !== state.view) heading.current?.focus();
    previousView.current = state.view;
  }, [state.view]);

  useEffect(() => () => inFlight.current?.controller.abort(), []);

  useEffect(() => {
    const retryAt = state.retryAt;
    if (retryAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    function waitUntil(deadline: number) {
      const delay = deadline - Date.now();
      if (delay <= 0) dispatch({ type: "cooldownEnded", retryAt: deadline });
      else timer = setTimeout(() => waitUntil(deadline), Math.min(delay, 2_147_483_647));
    }
    waitUntil(retryAt);
    return () => clearTimeout(timer);
  }, [state.retryAt]);

  function cancelRequest() {
    const request = inFlight.current;
    inFlight.current = null;
    request?.controller.abort();
  }

  function beginRequest(key: string) {
    cancelRequest();
    const controller = new AbortController();
    inFlight.current = { key, controller };
    return controller;
  }

  async function findCareers(input: Interests) {
    if (state.retryAt !== null) return;
    const key = `recommend:${JSON.stringify(input)}`;
    if (inFlight.current?.key === key) return;
    const version = ++versionRef.current;
    let controller: AbortController | undefined;
    dispatch({ type: "submit", input, version });
    try {
      controller = beginRequest(key);
      const { careers } = await fetchRecommendations(input, controller.signal);
      if (!controller.signal.aborted) dispatch({ type: "careersLoaded", version, careers });
    } catch (error) {
      if (!controller?.signal.aborted) dispatch({
        type: "requestFailed", version, error,
      });
    } finally {
      if (controller && inFlight.current?.controller === controller) inFlight.current = null;
    }
  }

  async function selectCareer(careerId: string) {
    if (state.roadmaps.has(careerId)) {
      cancelRequest();
      dispatch({ type: "select", careerId });
      return;
    }
    if (state.retryAt !== null) return;
    const key = `roadmap:${careerId}`;
    if (inFlight.current?.key === key) return;
    const version = versionRef.current;
    let controller: AbortController | undefined;
    dispatch({ type: "select", careerId });
    try {
      controller = beginRequest(key);
      const roadmap = await fetchRoadmap(careerId, controller.signal);
      if (!controller.signal.aborted) dispatch({ type: "roadmapLoaded", version, careerId, roadmap });
    } catch (error) {
      if (!controller?.signal.aborted) dispatch({
        type: "requestFailed", version, careerId, error,
      });
    } finally {
      if (controller && inFlight.current?.controller === controller) inFlight.current = null;
    }
  }

  function back(type: "backToInput" | "backToCareers") {
    cancelRequest();
    dispatch({ type });
  }

  function retry() {
    if (state.retryAt !== null) return;
    heading.current?.focus();
    if (state.view === "careers" && state.submitted) void findCareers(state.submitted);
    if (state.view === "roadmap" && state.selectedCareerId) void selectCareer(state.selectedCareerId);
  }

  const selected = state.careers.find(({ id }) => id === state.selectedCareerId);
  const roadmap = state.selectedCareerId ? state.roadmaps.get(state.selectedCareerId) : undefined;
  const loading = state.status === "loading";
  const statusText = loading ? (state.view === "careers" ? "Finding careers…" : "Loading your roadmap…")
    : state.status === "ready" && state.view === "careers" && state.careers.length ? "Three career recommendations are ready."
    : state.status === "ready" && state.view === "roadmap" && roadmap ? "Your roadmap is ready." : "";
  const coolingDown = state.retryAt !== null;

  return (
    <>
      <div className={state.view === "input" ? "hero" : "hero hero--compact"}>
        <h1>Explore STEM careers</h1>
        {state.view === "input" && (
          <p>Start with what you’re curious about. STEMBridge AI suggests careers that match your interests and shows what to learn first.</p>
        )}
      </div>
      {seed && (
        <aside aria-label="Development catalog" className="seed-notice">
          <strong>Development catalog.</strong> These sample careers use placeholder links for testing.
        </aside>
      )}
      <ol role="list" aria-label="Exploration progress" className="progress">
        {Object.entries(viewLabel).map(([view, label]) => (
          <li key={view} aria-current={view === state.view ? "step" : undefined}>{label}</li>
        ))}
      </ol>

      <section className="explore-panel" aria-labelledby="view-heading">
        {coolingDown && state.status !== "error" && (
          <p role="status" className="request-state">Please wait before making another request.</p>
        )}
        {state.view === "input" ? (
          <>
            <h2 id="view-heading" ref={heading} tabIndex={-1}>Start with your interests</h2>
            <InterestForm draft={state.draft} onEdit={(draft) => dispatch({ type: "edit", draft })} onSubmit={findCareers} paused={coolingDown} />
          </>
        ) : (
          <>
            <button className="back-button" type="button" onClick={() => back(state.view === "careers" ? "backToInput" : "backToCareers")}>
              <span aria-hidden="true">←</span> {state.view === "careers" ? "Edit interests" : "Back to careers"}
            </button>
            <h2 id="view-heading" ref={heading} tabIndex={-1}>
              {state.view === "careers" ? "Your career recommendations" : `${selected?.title ?? "Career"} roadmap`}
            </h2>
            {state.status === "error" && (
              <div className="request-state error-state">
                <p role="alert">{state.error}</p>
                <button type="button" className="secondary-button" onClick={retry} disabled={coolingDown}>Try again</button>
              </div>
            )}
            {state.view === "careers" && state.status === "ready" && (
              state.careers.length ? <CareerList careers={state.careers} select={selectCareer}
                isPaused={(id) => coolingDown && !state.roadmaps.has(id)} />
                : <p className="request-state">No careers to show yet. Edit your interests and try again.</p>
            )}
            {state.view === "roadmap" && state.status === "ready" && (
              roadmap ? <RoadmapView roadmap={roadmap} seed={seed} />
                : <p className="request-state">This roadmap is unavailable. Go back and choose a career.</p>
            )}
          </>
        )}
        <p role="status" className={loading ? "request-state loading-state" : "sr-only"}>{statusText}</p>
      </section>
    </>
  );
}
