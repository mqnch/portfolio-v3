const experience = [
  {
    title: "MEMOTEXT — software engineer",
    href: "https://mtxt.ai",
    period: "2026",
  },
  {
    title: "WATonomous — software engineer",
    href: "https://www.watonomous.ca",
    period: "2025",
  },
  {
    title: "VEX Robotics — team lead",
    href: null,
    period: "2021—2025",
  },
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

const links = [
  { label: "github", href: "https://github.com/mqnch" },
  { label: "linkedin", href: "https://www.linkedin.com/in/felixpan1" },
  { label: "email", href: "mailto:f3pan@uwaterloo.ca" },
  { label: "source", href: "https://github.com/mqnch/portfolio-v3" },
];

export default function Page() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md space-y-12 text-center">
        <header className="space-y-3">
          <h1 className="text-2xl font-light tracking-tight">felix pan</h1>
          <p className="text-muted leading-relaxed">
            studying cs at uwaterloo, building agents at memotext.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.25em] text-faint">
            experience
          </h2>
          <ul className="space-y-1.5">
            {experience.map((item) => (
              <li
                key={item.title}
                className="flex items-baseline justify-center gap-3"
              >
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span>{item.title}</span>
                )}
                <span className="text-faint text-sm">{item.period}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.25em] text-faint">
            projects
          </h2>
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.name} className="space-y-0.5">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  {project.name}
                </a>
                <p className="text-muted text-sm leading-relaxed">
                  {project.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="space-y-4">
          <div className="flex items-center justify-center gap-5 text-sm text-muted">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-faint">2026 © felix pan</p>
        </footer>
      </div>
    </main>
  );
}
