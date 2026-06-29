import type { ReactNode } from "react";

export type Scene = {
  id: string;
  /** Short label shown in the scene nav. */
  label: string;
  /** Background image shown for this scene. Falls back to the default. */
  image?: string;
  content: ReactNode;
};

const experience = [
  { title: "MEMOTEXT — software engineer", href: "https://mtxt.ai", period: "2026" },
  { title: "WATonomous — software engineer", href: "https://www.watonomous.ca", period: "2025" },
  { title: "VEX Robotics — team lead", href: null, period: "2021—2025" },
];

const projects = [
  {
    name: "musicoverlay",
    description: "keyboard-driven macos hud for controlling music without switching apps.",
    href: "https://github.com/mqnch/musicoverlay",
  },
  {
    name: "getajobchud.com",
    description: "scrapes internships and helps you track your applications.",
    href: "https://www.getajobchud.com",
  },
  {
    name: "cumo",
    description: "always-on command bar that turns natural language into scheduled events.",
    href: "https://trycumo.com",
  },
  {
    name: "loan prediction model",
    description: "cox survival model predicting loan default risk with fairness analysis.",
    href: "https://github.com/mqnch/loan-prediction-model",
  },
  {
    name: "self-learning chess ai",
    description: "alphazero-style engine with monte carlo tree search and self-play.",
    href: "https://github.com/mqnch/chess-ai",
  },
  {
    name: "hearth.",
    description: "real estate analyzer generating renovation visualizations and cost estimates.",
    href: "https://github.com/mqnch/hearth.",
  },
];

export const scenes: Scene[] = [
  {
    id: "about",
    label: "about",
    content: (
      <p className="text-muted leading-relaxed text-lg">
        i&apos;m currently studying computer science at{" "}
        <a
          href="https://uwaterloo.ca"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap border-b border-current/40 pb-px hover:border-current"
        >
          <img src="/images/uwaterloo.svg" alt="" className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85" />
          UWaterloo
        </a>{" "}
        &amp; building agents at{" "}
        <a
          href="https://mtxt.ai"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap border-b border-current/40 pb-px hover:border-current"
        >
          <span className="mr-1 inline-block h-[1em] w-[1em] overflow-hidden rounded-sm align-[-0.15em]">
            <img src="/images/mtxt.png" alt="" className="h-full w-full scale-[1.6] opacity-85" />
          </span>
          MEMOTEXT
        </a>{" "}
        &amp;{" "}
        <a
          href="https://www.tribalscale.com"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap border-b border-current/40 pb-px hover:border-current"
        >
          <img src="/images/tribalscale.jpg" alt="" className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85" />
          TribalScale
        </a>
        .
        <br />
        <br />
        i live to eat, listen, and travel.
        <br />
        <br />
        after i retire at 30, you can find me on my tea farm in{" "}
        <a
          href="https://en.wikipedia.org/wiki/Yixing"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap border-b border-current/40 pb-px hover:border-current"
        >
          yixing, china
        </a>
        .
      </p>
    ),
  },
  {
    id: "work",
    label: "work",
    content: (
      <div className="space-y-3">
        <p className="text-muted leading-relaxed">a rough timeline of what i&apos;ve worked on:</p>
        <ul className="space-y-1.5">
          {experience.map((item) => (
            <li key={item.title} className="flex items-baseline justify-between gap-3">
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {item.title}
                </a>
              ) : (
                <span>{item.title}</span>
              )}
              <span className="text-faint text-sm">{item.period}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "building",
    label: "building",
    content: (
      <div className="space-y-3">
        <p className="text-muted leading-relaxed">some things i&apos;ve made:</p>
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.name} className="space-y-0.5">
              <a href={project.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                {project.name}
              </a>
              <p className="text-muted text-sm leading-relaxed">{project.description}</p>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "blog",
    label: "blog",
    // image: "/images/blog.png",
    content: (
      <p className="text-muted leading-relaxed">
        nothing here yet — writing soon.
      </p>
    ),
  },
  {
    id: "other",
    label: "other",
    // image: "/images/other.png",
    content: (
      <p className="text-muted leading-relaxed">
        a place for everything else. coming soon.
      </p>
    ),
  },
];

export const links: { label: string; href: string | null }[] = [
  { label: "github", href: "https://github.com/mqnch" },
  { label: "linkedin", href: "https://www.linkedin.com/in/felixpan1" },
  { label: "email", href: "mailto:f3pan@uwaterloo.ca" },
  { label: "x", href: null },
];
