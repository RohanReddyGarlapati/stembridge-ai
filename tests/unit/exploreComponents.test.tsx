import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { InterestForm } from "../../components/InterestForm";
import { RoadmapView } from "../../components/RoadmapView";

it("labels the interest textbox and marks a selected chip without submitting the form", () => {
  const markup = renderToStaticMarkup(<InterestForm
    draft={{ interests: "", tags: ["robots"] }} onEdit={() => {}} onSubmit={() => {}}
  />);
  expect(markup).toContain('<label for="interests">');
  expect(markup).toContain('aria-describedby="interests-hint interests-count"');
  expect(markup).not.toContain('name="interests"');
  expect(markup).toMatch(/type="button" aria-pressed="true">Robots<\/button>/);
});

it("renders ordered seed steps and identifies placeholder links and their new-tab behavior", () => {
  const markup = renderToStaticMarkup(<RoadmapView seed roadmap={{
    career: { id: "robotics-engineer", title: "Robotics Engineer" },
    personalization: "none",
    steps: [{
      id: "robotics-programming", order: 1, title: "Practice programming", description: "Write a short program.",
      skills: ["Programming"], duration: "2 weeks", resources: [{
        id: "seed-programming", title: "Placeholder: Programming practice", provider: "Development seed only",
        url: "https://example.com/stembridge-seed/programming", verifiedAt: "2000-01-01",
        cost: "free", type: "interactive",
      }],
    }],
  }} />);
  expect(markup).toContain('<ol class="roadmap" aria-label="Roadmap steps">');
  expect(markup).toContain('target="_blank" rel="noopener noreferrer"');
  expect(markup).toContain("(opens in a new tab)");
  expect(markup).toContain("Placeholder link");
});
