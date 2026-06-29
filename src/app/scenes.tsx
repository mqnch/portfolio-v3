import type { ReactNode } from "react";
import type { ImageTuning } from "@/components/ImageEngine";
import ProjectsPanel from "@/components/ProjectsPanel";

export type Scene = {
  id: string;
  /** Short label shown in the scene nav. */
  label: string;
  /** Background image + its per-image look. Falls back to `defaultImage`. */
  image?: ImageTuning;
  /** Short location label shown over the background image. */
  caption?: string;
  /** Tailwind text-color class for the caption, tuned per image. Defaults to text-faint. */
  captionColor?: string;
  content: ReactNode;
};

// Per-image render specs. Each photo gets its own look (where the horizon sits,
// how calm the sky is, etc.). Anything omitted uses the engine's DEFAULT_TUNING.
// Add a new photo by declaring another ImageTuning here and pointing a scene at it.

// Hong Kong harbour from the Peak. Horizon sits just below mid-frame; the sky is
// kept calm so the clouds don't shine or shimmer.
export const aboutImage: ImageTuning = {
  src: "/images/IMG_7933.webp",
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
  src: "/images/IMG_7972_2.webp",
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
  src: "/images/IMG_9347.webp",
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
  src: "/images/IMG_7630.webp",
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
  src: "/images/IMG_7480.webp",
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
  { title: "TribalScale — software engineer", href: "https://www.tribalscale.com", period: "present", logo: "/images/tribalscale.jpg", logoScale: null },
  { title: "MEMOTEXT — software engineer", href: "https://mtxt.ai", period: "present", logo: "/images/mtxt.png", logoScale: "scale-[1.55]" },
  { title: "WATonomous — software engineer", href: "https://www.watonomous.ca", period: "2025", logo: "/images/wato.png", logoScale: null },
  { title: "VEX Robotics — team lead", href: null, period: "2021—2025", logo: "/images/vex.png", logoScale: null },
];

export type Project = {
  name: string;
  /** Short blurb shown in the collapsed list. */
  description: string;
  /** External link, surfaced as a "visit" action in the expanded view. */
  href: string;
  /** Longer write-up shown when the project is expanded. */
  details?: string;
  /** Small tech/stack tags. */
  tech?: string[];
  year?: string;
  /** Screenshots shown stacked in the expanded view. Drop files in /public/images/projects. */
  images?: { src: string; alt: string }[];
};

export const projects: Project[] = [
  {
    name: "musicoverlay",
    description: "keyboard-driven macos hud for controlling music without switching apps.",
    href: "https://github.com/mqnch/musicoverlay",
    year: "2025",
    tech: ["swift", "swiftui", "appkit"],
    details:
      "a translucent heads-up display that floats over any app. trigger it with a global hotkey to scrub, skip, and search your library without ever leaving what you're doing. built natively for macos with a focus on speed and staying out of the way.",
    images: [
      { src: "/images/projects/musicoverlay-1.png", alt: "musicoverlay hud over a desktop" },
      { src: "/images/projects/musicoverlay-2.png", alt: "musicoverlay search view" },
    ],
  },
  {
    name: "getajobchud.com",
    description: "scrapes internships and helps you track your applications.",
    href: "https://www.getajobchud.com",
    year: "2025",
    tech: ["next.js", "postgres", "playwright"],
    details:
      "aggregates fresh internship postings from across the web and gives you a single board to track every application's status. nightly scrapers keep listings current so you spend less time hunting and more time applying.",
    images: [
      { src: "/images/projects/getajobchud-1.png", alt: "getajobchud listings board" },
    ],
  },
  {
    name: "cumo",
    description: "always-on command bar that turns natural language into scheduled events.",
    href: "https://trycumo.com",
    year: "2024",
    tech: ["next.js", "openai", "google calendar"],
    details:
      "type something like \"lunch with sam friday at noon\" and cumo parses it into a real calendar event. an always-available command bar that turns plain english into structured scheduling.",
    images: [
      { src: "/images/projects/cumo-1.png", alt: "cumo command bar" },
    ],
  },
  {
    name: "loan prediction model",
    description: "cox survival model predicting loan default risk with fairness analysis.",
    href: "https://github.com/mqnch/loan-prediction-model",
    year: "2024",
    tech: ["python", "lifelines", "pandas"],
    details:
      "a cox proportional-hazards survival model that predicts the timing of loan default rather than just a yes/no, paired with a fairness analysis across demographic groups to surface and quantify bias in the predictions.",
    images: [
      { src: "/images/projects/loan-1.png", alt: "survival curves" },
    ],
  },
  {
    name: "self-learning chess ai",
    description: "alphazero-style engine with monte carlo tree search and self-play.",
    href: "https://github.com/mqnch/chess-ai",
    year: "2023",
    tech: ["python", "pytorch", "mcts"],
    details:
      "an alphazero-inspired engine that learns chess entirely from self-play, with no human games. a neural network guides monte carlo tree search, and the two improve together over thousands of games against itself.",
    images: [
      { src: "/images/projects/chess-1.png", alt: "chess ai self-play" },
    ],
  },
  {
    name: "hearth.",
    description: "real estate analyzer generating renovation visualizations and cost estimates.",
    href: "https://github.com/mqnch/hearth.",
    year: "2024",
    tech: ["next.js", "diffusion", "openai"],
    details:
      "point hearth at a listing and it generates renovation visualizations alongside cost estimates, helping you see a property's potential and what it would take to get there.",
    images: [
      { src: "/images/projects/hearth-1.png", alt: "hearth renovation visualization" },
    ],
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
          href="https://www.tribalscale.com"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-foreground border-b border-transparent hover:border-current"
        >
          <img src="/images/tribalscale.jpg" alt="" className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85" />
          TribalScale
        </a>{" "}
        &amp;{" "}
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
        once i retire at 29, you can find me on my tea farm in{" "}
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
          {experience.map((item) => {
            const logo = item.logoScale ? (
              <span className="mr-1.5 inline-block h-[1.05em] w-[1.05em] overflow-hidden rounded-sm align-[-0.15em]">
                <img src={item.logo} alt="" className={`h-full w-full object-cover opacity-90 ${item.logoScale}`} />
              </span>
            ) : (
              <img src={item.logo} alt="" className="mr-1.5 inline-block h-[1.05em] w-[1.05em] rounded-sm object-cover align-[-0.15em] opacity-90" />
            );
            return (
              <li key={item.title} className="flex items-baseline justify-between gap-3">
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    {logo}
                    {item.title}
                  </a>
                ) : (
                  <span>
                    {logo}
                    {item.title}
                  </span>
                )}
                <span className="text-faint text-sm">{item.period}</span>
              </li>
            );
          })}
        </ul>
      </div>
    ),
  },
  {
    id: "building",
    label: "built",
    image: builtImage,
    caption: "university of waterloo",
    captionColor: "text-white",
    content: <ProjectsPanel />,
  },
  {
    id: "blog",
    label: "blog",
    image: blogImage,
    caption: "osaka aquarium",
    captionColor: "text-foreground",
    content: (
      <p className="text-muted leading-relaxed text-lg">
        life is sunshine and rainbows
      </p>
    ),
  },
  {
    id: "other",
    label: "other",
    image: otherImage,
    caption: "train from nara to kyoto",
    captionColor: "text-white",
    content: (
      <p className="text-muted leading-relaxed text-lg">
        i rank every place i eat on beli{" "}
        <span className="text-foreground">@felixpan</span>. my top-rated spot
        is{" "}
        <a
          href="https://maps.app.goo.gl/MyCh9r3YLmio7fGu5"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Namaste Nepal
        </a>
        , a nepalese
        restaurant in tokyo.
        <br />
        <br />
        my favorite artist this year is{" "}
        <a
          href="https://open.spotify.com/artist/1swF0fjO1rWmJEbygzTpf2"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          reiko
        </a>
        .
        here's my top 3:
        <br />
        <a
          href="https://open.spotify.com/track/5tdLqrYYsKP5TxT8RJ3VtQ"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          wantmetoo - reiko
        </a>
        <br />
        <a
          href="https://open.spotify.com/track/6Cgdqm78siouXhd4NlMYn3"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          maybes - reiko
        </a>
        <br />
        <a
          href="https://open.spotify.com/track/3peZooXvocw3H5qe0R0yH7"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          empty heart — noho, reiko
        </a>
        <br />
        <br />
        so far i&apos;ve gone on{" "}
        <span className="text-foreground font-medium">28</span> trips in my{" "}
        <span className="text-foreground font-medium">19</span> years of living.
        <br />
        this winter i&apos;m planning to travel to{" "}
        <span className="text-foreground">south korea</span> and revisit{" "}
        <span className="text-foreground">china</span>.
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
