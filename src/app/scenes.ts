import type { ImageTuning } from "@/components/ImageEngine";

export type Scene = {
  id: string;
  /** Short label shown in the scene nav. */
  label: string;
  /** App Router path for this scene. */
  href: string;
  /** Background image + its per-image look. Falls back to `defaultImage`. */
  image?: ImageTuning;
  /** Short location label shown over the background image. */
  caption?: string;
  /** Tailwind text-color class for the caption, tuned per image. Defaults to text-faint. */
  captionColor?: string;
};

// Per-image render specs. Each photo gets its own look (where the horizon sits,
// how calm the sky is, etc.). Anything omitted uses the engine's DEFAULT_TUNING.
// Add a new photo by declaring another ImageTuning here and pointing a scene at it.

// Hong Kong harbour from the Peak. Horizon sits just below mid-frame; the sky is
// kept calm so the clouds don't shine or shimmer.
export const aboutImage: ImageTuning = {
  src: "/images/IMG_7933.8ef94cab.webp",
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
  src: "/images/IMG_7972_2.d3b11658.webp",
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

// Built photo: garden pond with bright reflections; deepen greens and cut glare.
export const builtImage: ImageTuning = {
  src: "/images/IMG_9608.c0c85538.webp",
  horizon: 0.55,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.88,
  gamma: 0.5,
  glow: 0.08,
  darkFill: 0.72,
  darkFillTexture: 0.4,
  saturation: 1.38,
};

// Other photo: rice paddy with a transmission tower under a big blue sky. The
// mountains/horizon sit just below mid-frame, with lots of calm sky above.
export const otherImage: ImageTuning = {
  src: "/images/IMG_7630.4134fb69.webp",
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
  src: "/images/IMG_7480.f1b1eef0.webp",
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

export const experience = [
  {
    company: "TribalScale",
    role: "Software Engineering Intern",
    location: "Toronto, ON",
    href: "https://www.tribalscale.com",
    period: "Present",
    logo: "/images/tribalscale.36350c1c.jpg",
    logoScale: null,
  },
  {
    company: "MEMOTEXT",
    role: "Software Engineering Intern",
    location: "Toronto, ON",
    href: "https://mtxt.ai",
    period: "2026",
    logo: "/images/mtxt.705ae0c1.png",
    logoScale: "scale-[1.55]",
  },
  {
    company: "WATonomous",
    role: "Software Engineer",
    location: "Waterloo, ON",
    href: "https://www.watonomous.ca",
    period: "2025",
    logo: "/images/wato.170c75f7.png",
    logoScale: null,
  },
];

export type Project = {
  name: string;
  /** Short blurb shown in the collapsed list. */
  description: string;
  /** Live site, surfaced as a "visit ->" action. Omit for projects with no site. */
  website?: string;
  /** Source repository, surfaced as a "repo ->" action. */
  repo?: string;
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
    name: "log-searcher",
    description: "fast log search agent from rl fine-tuning edge models.",
    repo: "https://github.com/mqnch/log-searcher",
    year: "2026",
    tech: ["rl", "fine-tuning", "prime intellect"],
    details:
      "an agent that searches logs instantly by fine-tuning small edge models with reinforcement learning. training and tooling are being built out on prime intellect. wip.",
  },
  {
    name: "sweatshop",
    description: "automated ticket → pr pipeline.",
    repo: "https://github.com/mqnch/sweatshop",
    year: "2026",
    tech: ["agents"],
    details:
      "takes a ticket and drives it through plan → implement → review → pr with minimal babysitting. a scripted agent loop with iteration caps and a human merge gate. wip.",
  },
  {
    name: "musicoverlay",
    description: "keyboard-driven macos hud for controlling music without switching apps.",
    repo: "https://github.com/mqnch/musicoverlay",
    year: "2025",
    tech: ["swift", "spotify api", "applescript"],
    details:
      "a translucent heads-up display that floats over any app. trigger it with a global hotkey to scrub, skip, and search your library without ever leaving what you're doing. built natively for macos with a focus on speed and staying out of the way.",
    images: [
      { src: "/images/projects/musicoverlay-1.e27fc25d.webp", alt: "musicoverlay hud" },
      { src: "/images/projects/musicoverlay-2.eb1707c9.webp", alt: "musicoverlay minihud" },
    ],
  },
  {
    name: "getajobchud.com",
    description: "scrapes internships and helps you track your applications.",
    website: "https://www.getajobchud.com",
    repo: "https://github.com/mqnch/jobmaxxing",
    year: "2025",
    tech: ["next.js", "typescript", "supabase"],
    details:
      "aggregates fresh internship postings from across the web and gives you a single board to track every application's status. nightly scrapers keep listings current so you spend less time hunting and more time applying.",
    images: [
      { src: "/images/projects/getajobchud-1.a31cac57.webp", alt: "getajobchud hero" },
      { src: "/images/projects/getajobchud-2.eab306c4.webp", alt: "getajobchud listings" },
      { src: "/images/projects/getajobchud-3.18979b8d.webp", alt: "getajobchud applications" },
    ],
  },
  {
    name: "cumo",
    description: "always-on command bar that turns natural language into scheduled events.",
    website: "https://trycumo.com",
    repo: "https://github.com/mqnch/Cumo",
    year: "2024",
    tech: ["electron", "typescript", "flask", "nlp"],
    details:
      "type something like \"lunch with sam friday at noon\" and cumo parses it into a real calendar event. an always-available command bar that turns plain english into structured scheduling.",
    images: [{ src: "/images/projects/cumo-1.bc8e4c4d.webp", alt: "cumo command bar" }],
  },
  {
    name: "self-learning chess ai",
    description: "alphazero-style engine with monte carlo tree search and self-play.",
    repo: "https://github.com/mqnch/chess-ai",
    year: "2023",
    tech: ["pytorch", "pandas", "cuda"],
    details:
      "an alphazero-inspired engine that learns chess entirely from self-play, with no human games. a neural network guides monte carlo tree search, and the two improve together over thousands of games against itself.",
  },
];

export const scenes: Scene[] = [
  {
    id: "about",
    label: "about",
    href: "/",
    caption: "victoria harbor, hk",
  },
  {
    id: "work",
    label: "work",
    href: "/work",
    image: workImage,
    caption: "lugard road trail, hk",
  },
  {
    id: "built",
    label: "built",
    href: "/built",
    image: builtImage,
    caption: "brooklyn botanical garden, nyc",
    captionColor: "text-white",
  },
  {
    id: "writing",
    label: "writing",
    href: "/writing",
    image: blogImage,
    caption: "osaka aquarium",
    captionColor: "text-foreground",
  },
  {
    id: "other",
    label: "other",
    href: "/other",
    image: otherImage,
    caption: "train from nara to kyoto",
    captionColor: "text-white",
  },
];

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function sceneIndexFromPath(pathname: string): number {
  const path = normalizePath(pathname);
  const index = scenes.findIndex((s) => s.href === path);
  return index === -1 ? 0 : index;
}

export const links: { label: string; href: string | null }[] = [
  { label: "github", href: "https://github.com/mqnch" },
  { label: "linkedin", href: "https://www.linkedin.com/in/felixpan1" },
  { label: "email", href: "mailto:f3pan@uwaterloo.ca" },
  { label: "x", href: null },
];
