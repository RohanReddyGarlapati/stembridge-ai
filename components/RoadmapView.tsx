import type { RoadmapResponse } from "../lib/types";

export function RoadmapView({ roadmap, seed }: { roadmap: RoadmapResponse; seed: boolean }) {
  return (
    <ol className="roadmap" aria-label="Roadmap steps">
      {roadmap.steps.map((step) => (
        <li key={step.id} className="roadmap-step" value={step.order}>
          <div className="step-heading">
            <h3>{step.title}</h3>
            <p className="duration">Estimated: {step.duration}</p>
          </div>
          <p className="muted">{step.description}</p>
          <ul className="skills" aria-label="Skills covered">
            {step.skills.map((skill, index) => <li key={index}>{skill}</li>)}
          </ul>
          <ul className="resources" aria-label="Learning resources">
            {step.resources.map((resource) => (
              <li key={resource.id}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.title} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <p>{resource.provider} · {resource.type} · {resource.cost}{seed && " · Placeholder link"}</p>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
