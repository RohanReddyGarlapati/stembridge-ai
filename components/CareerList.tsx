import type { RecommendResponse } from "../lib/types";

export function CareerList({ careers, select, isPaused }: {
  careers: RecommendResponse["careers"]; select: (id: string) => void; isPaused: (id: string) => boolean;
}) {
  return (
    <ul className="career-grid" aria-label="Career recommendations">
      {careers.map((career) => (
        <li key={career.id} className="career-card">
          <h3>{career.title}</h3>
          <p className="muted">{career.summary}</p>
          <p className="match-reason">{career.reason}</p>
          <ul className="skills" aria-label="Key skills">
            {career.keySkills.map((skill, index) => <li key={index}>{skill}</li>)}
          </ul>
          <button type="button" className="secondary-button" onClick={() => select(career.id)} disabled={isPaused(career.id)}
            aria-label={`View roadmap for ${career.title}`}>
            View roadmap <span aria-hidden="true">→</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
