import type { Career, Resource, RoadmapStep } from "../../lib/types";

// Ranking fixtures share test steps and seed URLs to satisfy the record and
// relationship rules. They are intentionally smaller than a release catalog.
function testSteps(): RoadmapStep[] {
  return [
    ["define", "Define a problem"], ["research", "Research an idea"],
    ["practice", "Try an exercise"], ["review", "Review the result"],
  ].map(([id, title]) => ({
    id, title, description: "Write a short note about this stage of the exercise.",
    skills: ["Problem solving"], duration: "1 week", resourceIds: ["seed-programming"],
  }));
}

export const fixtureResources: readonly Resource[] = [
  {
    id: "seed-programming", title: "Placeholder: Programming practice",
    provider: "Development seed only", url: "https://example.com/stembridge-seed/programming",
    type: "interactive", cost: "free", level: "beginner", verifiedAt: "2000-01-01",
  },
  {
    id: "seed-sensors", title: "Placeholder: Sensor and measurement practice",
    provider: "Development seed only", url: "https://example.com/stembridge-seed/sensors",
    type: "video", cost: "free", level: "beginner", verifiedAt: "2000-01-01",
  },
];

export const fixtureCareers: readonly Career[] = [
  {
    id: "software-engineer", title: "Software Engineer", field: "technology",
    summary: "Designs and builds software.", tags: ["coding", "design"],
    keySkills: ["Programming", "Testing", "Version control"], steps: testSteps(),
  },
  {
    id: "robotics-engineer", title: "Robotics Engineer", field: "engineering",
    summary: "Designs and builds robots.", tags: ["robots", "coding", "building", "space"],
    keySkills: ["Programming", "Electronics", "Mechanics"],
    steps: [
      { id: "robotics-programming", title: "Practice programming", description: "Write a short program.",
        skills: ["Programming"], duration: "2 weeks", resourceIds: ["seed-programming"] },
      { id: "robotics-sensing", title: "Work with sensors", description: "Explain what a sensor measures.",
        skills: ["Electronics"], duration: "2 weeks", resourceIds: ["seed-sensors", "seed-programming"] },
      { id: "robotics-circuits", title: "Explore circuits", description: "Describe a sensor circuit.",
        skills: ["Electronics"], duration: "2 weeks", resourceIds: ["seed-sensors"] },
      { id: "robotics-prototype", title: "Plan a prototype", description: "Sketch a prototype and plan a test.",
        skills: ["Prototyping"], duration: "3 weeks", resourceIds: ["seed-programming"] },
    ],
  },
  {
    id: "data-scientist", title: "Data Scientist", field: "technology",
    summary: "Uses data to answer questions.", tags: ["data-math", "coding"],
    keySkills: ["Statistics", "Programming", "Visualization"], steps: testSteps(),
  },
  {
    id: "environmental-scientist", title: "Environmental Scientist", field: "science",
    summary: "Studies ecosystems and environmental change.", tags: ["environment", "biology"],
    keySkills: ["Observation", "Ecology", "Data analysis"], steps: testSteps(),
  },
  {
    id: "cybersecurity-analyst", title: "Cybersecurity Analyst", field: "technology",
    summary: "Helps protect systems and data.", tags: ["security", "electronics"],
    keySkills: ["Security fundamentals", "Risk management", "Monitoring"], steps: testSteps(),
  },
  {
    id: "ai-engineer", title: "AI Engineer", field: "technology",
    summary: "Builds machine learning systems.", tags: ["coding", "data-math", "robots"],
    keySkills: ["Programming", "Mathematics", "Machine learning"], steps: testSteps(),
  },
];
