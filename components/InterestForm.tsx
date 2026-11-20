"use client";

import { useRef, useState, type FormEvent } from "react";
import { interestTagSchema, recommendRequestSchema } from "../lib/schemas";
import type { Interests, InterestTag } from "../lib/types";

const tags = {
  robots: "Robots", coding: "Coding", space: "Space", biology: "Biology",
  environment: "Environment", building: "Building things", health: "Health",
  "data-math": "Data & math", electronics: "Electronics", security: "Cybersecurity", design: "Design",
} satisfies Record<InterestTag, string>;

type Props = { draft: Interests; onEdit: (draft: Interests) => void; onSubmit: (input: Interests) => void; paused?: boolean };

export function InterestForm({ draft, onEdit, onSubmit, paused = false }: Props) {
  const [error, setError] = useState("");
  const textbox = useRef<HTMLTextAreaElement>(null);
  const length = Array.from(draft.interests.trim()).length;

  function edit(next: Interests) {
    setError("");
    onEdit(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paused) return;
    const result = recommendRequestSchema.safeParse(draft);
    if (result.success) {
      onSubmit(result.data);
      return;
    }
    setError(length > 300 ? "Shorten your answer to 300 characters or fewer."
      : "Tell us what you enjoy in a few words, or pick at least one interest below.");
    textbox.current?.focus();
  }

  return (
    <form className="interest-form" onSubmit={submit} autoComplete="off">
      <label htmlFor="interests">What are you curious about?</label>
      <p id="interests-hint" className="field-note">Describe what you enjoy. Don’t include your name or other personal details.</p>
      <textarea
        ref={textbox} id="interests" rows={3}
        placeholder="For example: I like building robots and coding"
        value={draft.interests} onChange={(event) => edit({ ...draft, interests: event.target.value })}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "interests-hint interests-count interests-error" : "interests-hint interests-count"}
      />
      <p id="interests-count" className={`field-note character-count ${length > 300 ? "over-limit" : ""}`}>{length} / 300 characters</p>
      {error && <p id="interests-error" role="alert" className="field-error">{error}</p>}
      <fieldset aria-describedby="chip-hint">
        <legend>Pick interests</legend>
        <p className="field-note" id="chip-hint">Choose up to eight, with or without a written answer.</p>
        <div className="chips">
          {interestTagSchema.options.map((tag) => {
            const selected = draft.tags.includes(tag);
            return (
              <button
                className="chip" key={tag} type="button" aria-pressed={selected}
                disabled={!selected && draft.tags.length >= 8}
                onClick={() => edit({ ...draft, tags: selected ? draft.tags.filter((value) => value !== tag) : [...draft.tags, tag] })}
              >
                {tags[tag]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button className="primary-button" type="submit" disabled={paused}>Find careers <span aria-hidden="true">→</span></button>
    </form>
  );
}
