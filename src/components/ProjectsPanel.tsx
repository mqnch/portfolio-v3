"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/app/scenes";
import ScrollArea from "@/components/ScrollArea";

// How long the fade-out runs before we swap views. Keep in sync with the
// `fade-out` animation duration in globals.css.
const TRANSITION_MS = 260;

export default function ProjectsPanel() {
  // The selection the user has committed to. null = collapsed list.
  const [index, setIndex] = useState<number | null>(null);
  // What's actually on screen; lags `index` during the exit animation.
  const [rendered, setRendered] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Suppress scene scroll-switching whenever a project is open.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("scene:lock", { detail: index !== null }));
  }, [index]);

  // Release the lock if we unmount mid-expansion (e.g. nav to another scene).
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("scene:lock", { detail: false }));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Drive the exit -> swap -> enter transition when the selection changes.
  useEffect(() => {
    if (index === rendered) return;
    setExiting(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setRendered(index);
      setExiting(false);
    }, TRANSITION_MS);
  }, [index, rendered]);

  // Escape collapses an open project.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && index !== null) {
        e.stopPropagation();
        setIndex(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  const project = rendered !== null ? projects[rendered] : null;

  return (
    <div
      key={project ? `detail-${rendered}` : "list"}
      className={exiting ? "fade-out" : "fade"}
    >
      {project ? (
        <ScrollArea className="max-h-[62vh] space-y-4 overflow-y-auto pr-4">
          <button
            type="button"
            onClick={() => setIndex(null)}
            className="text-faint text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            ← back
          </button>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-foreground text-xl">{project.name}</h2>
              {project.year && <span className="text-faint text-sm">{project.year}</span>}
            </div>
            {project.tech && project.tech.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-faint/40 px-2 py-0.5 text-xs text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-muted text-sm leading-relaxed">
            {project.details ?? project.description}
          </p>

          {project.images && project.images.length > 0 && (
            <div className="space-y-3">
              {project.images.map((img) => (
                <div
                  key={img.src}
                  className="overflow-hidden rounded-md border border-faint/30 bg-foreground/5"
                  style={{ aspectRatio: "16 / 10" }}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    onError={(e) => {
                      // Until real screenshots are dropped in, fall back to the
                      // empty placeholder box rather than a broken-image icon.
                      e.currentTarget.style.display = "none";
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-foreground underline-offset-4 hover:underline"
          >
            visit →
          </a>
        </ScrollArea>
      ) : (
        <div className="space-y-3 text-lg">
          <p className="text-muted leading-relaxed">some things i&apos;ve made:</p>
          <ul className="space-y-3">
            {projects.map((p, i) => (
              <li key={p.name}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className="group block w-full text-left"
                >
                  <span className="underline-offset-4 group-hover:underline">{p.name}</span>
                  <p className="text-muted text-sm leading-relaxed">{p.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
