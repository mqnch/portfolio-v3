import type { ReactNode } from "react";
import type { ImageTuning } from "@/components/ImageEngine";

export type Scene = {
  id: string;
  /** Short label shown in the scene nav. */
  label: string;
  /** Background image + its per-image look. Falls back to `defaultImage`. */
  image?: ImageTuning;
  /** Short location label shown over the background image. */
  caption?: string;
  /** Render the caption in dark text (for lighter images). */
  captionDark?: boolean;
  content: ReactNode;
};

// Per-image render specs. Each photo gets its own look (where the horizon sits,
// how calm the sky is, etc.). Anything omitted uses the engine's DEFAULT_TUNING.
// Add a new photo by declaring another ImageTuning here and pointing a scene at it.

// Hong Kong harbour from the Peak. Horizon sits just below mid-frame; the sky is
// kept calm so the clouds don't shine or shimmer.
export const aboutImage: ImageTuning = {
  src: "/images/IMG_7933.jpeg",
  horizon: 0.48,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.78,
  // Default gamma/glow blow out the hazy sky; sink midtones and trim the bloom.
  gamma: 0.42,
  glow: 0.25,
};

// Work photo: the skyline rises much higher in frame, so push the horizon up and
// keep the (smaller) band of sky above it calm.
export const workImage: ImageTuning = {
  src: "/images/IMG_7972%202.jpeg",
  horizon: 0.55,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.85,
  // On the white-paper halftone, small dots show the paper through, so dark
  // areas read as white. Lower gamma fills dark regions with darker ink so they
  // stop reading white, and lower glow stops the bright city lights blowing out.
  gamma: 0.42,
  glow: 0.25,
  // The true-black foreground corners have no dots at all (pure paper); darkFill
  // gives those darkest cells a solid dark dot so they read dark, not white.
  // darkFillTexture adds a little charcoal grain so they aren't flat black.
  darkFill: 0.95,
  darkFillTexture: 0.4,
};

// Built photo: railway crossing at sunset, skyline sitting around mid-frame.
// Keep the sky calm so the sunset gradient stays smooth.
export const builtImage: ImageTuning = {
  src: "/images/IMG_9347.jpeg",
  horizon: 0.55,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.8,
  // The bright sunset blows out by default: lower gamma sinks the midtones,
  // lower glow stops the sky/lights bleeding to white, and darkFill gives the
  // dark foreground solid dots so it stops reading as white paper.
  gamma: 0.24,
  glow: 0.14,
  darkFill: 0.6,
};

// Other photo: rice paddy with a transmission tower under a big blue sky. The
// mountains/horizon sit just below mid-frame, with lots of calm sky above.
export const otherImage: ImageTuning = {
  src: "/images/IMG_7630.jpeg",
  horizon: 0.58,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.8,
  // The bright blue sky blows out by default: lower gamma sinks the midtones
  // and lower glow keeps the sky/clouds from bleeding to white.
  gamma: 0.42,
  glow: 0.2,
};

// Blog photo: a whale shark in a dark aquarium tank. There's no real sky, so
// push the horizon to the top so the whole frame reads as "water" (still, no
// twinkle). Lower gamma lifts the dim fish/detail out of the dark water, and a
// little darkFill keeps the darkest corners reading as ink rather than paper.
export const blogImage: ImageTuning = {
  src: "/images/IMG_7480.jpeg",
  horizon: 1,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.9,
  gamma: 0.34,
  glow: 0.18,
  darkFill: 0.5,
  darkFillTexture: 0.4,
};

/** Image used by scenes that don't declare their own. */
export const defaultImage: ImageTuning = aboutImage;

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
    caption: "victoria harbor, hk",
    content: (
      <p className="text-muted leading-relaxed text-lg">
        i&apos;m currently studying computer science at{" "}
        <span className="whitespace-nowrap text-foreground">
          <img src="/images/uwaterloo.svg" alt="" className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85" />
          UWaterloo
        </span>{" "}
        &amp; building agents at{" "}
        <a
          href="https://mtxt.ai"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-foreground border-b border-transparent hover:border-current"
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
          className="whitespace-nowrap text-foreground border-b border-transparent hover:border-current"
        >
          <img src="/images/tribalscale.jpg" alt="" className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85" />
          TribalScale
        </a>
        .
        <br />
        <br />
        i live to{" "}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("scene:navigate", { detail: "other" }))}
          className="text-foreground underline-offset-4 hover:underline"
        >
          eat
        </button>
        ,{" "}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("scene:navigate", { detail: "other" }))}
          className="text-foreground underline-offset-4 hover:underline"
        >
          listen
        </button>
        , and{" "}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("scene:navigate", { detail: "other" }))}
          className="text-foreground underline-offset-4 hover:underline"
        >
          travel
        </button>
        .
        <br />
        <br />
        after i retire at 29, you can find me on my tea farm in{" "}
        <a
          href="https://en.wikipedia.org/wiki/Yixing"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-foreground border-b border-transparent hover:border-current"
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
    image: workImage,
    caption: "lugard road trail, hk",
    content: (
      <div className="space-y-3 text-lg">
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
    label: "built",
    image: builtImage,
    caption: "university of waterloo",
    captionDark: true,
    content: (
      <div className="space-y-3 text-lg">
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
    image: blogImage,
    caption: "osaka aquarium",
    captionDark: true,
    content: (
      <p className="text-muted leading-relaxed text-lg">
        nothing here yet — writing soon.
      </p>
    ),
  },
  {
    id: "other",
    label: "other",
    image: otherImage,
    caption: "nara train to kyoto",
    captionDark: true,
    content: (
      <p className="text-muted leading-relaxed text-lg">
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
