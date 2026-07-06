"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scenes as defaultScenes, links, defaultImage, type Scene } from "@/app/scenes";
import ImageEngine from "@/components/ImageEngine";

type SceneSwitcherProps = {
  scenes?: Scene[];
  title?: string;
  footerLinks?: { label: string; href: string | null }[];
};

const COOLDOWN = 200;
const WHEEL_THRESHOLD = 10;
// Pixels of trackpad delta before one scene step. Momentum tail events are
// absorbed during WHEEL_COOLDOWN instead of triggering extra steps.
const WHEEL_STEP_ACCUM = 100;
const WHEEL_COOLDOWN = 450;
const SWIPE_THRESHOLD = 25;

export default function SceneSwitcher({
  scenes = defaultScenes,
  title = "felix pan",
  footerLinks = links,
}: SceneSwitcherProps) {
  const [current, setCurrent] = useState(0);
  const scene = scenes[current];

  const lockedRef = useRef(false);
  // Set while an expanded project (or other overlay) wants to own scrolling and
  // keyboard nav, so we don't switch scenes out from under it.
  const navLockedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback((ms = COOLDOWN) => {
    lockedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lockedRef.current = false;
    }, ms);
  }, []);

  const goToScene = useCallback(
    (index: number) => {
      setCurrent((prev) => {
        const next = Math.max(0, Math.min(scenes.length - 1, index));
        if (next === prev) return prev;
        lock();
        return next;
      });
    },
    [lock]
  );

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const index = scenes.findIndex((s) => s.id === id);
      if (index !== -1) goToScene(index);
    };
    window.addEventListener("scene:navigate", onNavigate as EventListener);
    return () => window.removeEventListener("scene:navigate", onNavigate as EventListener);
  }, [goToScene]);

  useEffect(() => {
    const onLock = (e: Event) => {
      navLockedRef.current = (e as CustomEvent<boolean>).detail;
    };
    window.addEventListener("scene:lock", onLock as EventListener);
    return () => window.removeEventListener("scene:lock", onLock as EventListener);
  }, []);

  useEffect(() => {
    const step = (delta: number, cooldown = COOLDOWN) => {
      if (lockedRef.current) return;
      setCurrent((prev) => {
        const next = Math.max(0, Math.min(scenes.length - 1, prev + delta));
        if (next === prev) return prev;
        lock(cooldown);
        return next;
      });
    };

    let wheelAccum = 0;
    let wheelIdleTimeout: ReturnType<typeof setTimeout> | null = null;

    const onWheel = (e: WheelEvent) => {
      // Let an open project scroll its own content instead of switching scenes.
      if (navLockedRef.current) return;
      if (Math.abs(e.deltaY) <= WHEEL_THRESHOLD) return;
      e.preventDefault();
      // Drop momentum tail events while cooling down so one flick stays one step.
      if (lockedRef.current) return;

      if (wheelAccum !== 0 && Math.sign(e.deltaY) !== Math.sign(wheelAccum)) {
        wheelAccum = 0;
      }
      wheelAccum += e.deltaY;

      if (Math.abs(wheelAccum) >= WHEEL_STEP_ACCUM) {
        step(wheelAccum > 0 ? 1 : -1, WHEEL_COOLDOWN);
        wheelAccum = 0;
      }

      if (wheelIdleTimeout) clearTimeout(wheelIdleTimeout);
      wheelIdleTimeout = setTimeout(() => {
        wheelAccum = 0;
      }, 150);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (navLockedRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (navLockedRef.current) return;
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      step(delta > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wheelIdleTimeout) clearTimeout(wheelIdleTimeout);
    };
  }, [lock]);

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden md:flex-row">
      <div className="text-panel relative z-10 flex h-full flex-col overflow-x-hidden px-6 py-10 md:px-16 md:py-14">
        <header className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </header>

        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <div key={scene.id} className="fade w-full min-w-0 space-y-6">
            {scene.content}
          </div>
        </div>

        <footer className="space-y-4">
          <nav className="flex items-center gap-5 text-sm">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToScene(i)}
                aria-current={i === current}
                className={`underline-offset-4 transition-colors hover:underline ${
                  i === current ? "text-foreground" : "text-faint hover:text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-5 text-sm text-muted">
            {footerLinks.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {link.label}
                </a>
              ) : (
                <span key={link.label} className="text-faint">
                  {link.label}
                </span>
              )
            )}
          </div>
        </footer>
      </div>

      <div className="image-panel">
        <div className="h-full w-full opacity-15 md:opacity-100">
          <ImageEngine image={scene.image ?? defaultImage} />
        </div>
        {scene.caption && (
          <span
            key={scene.id}
            className={`fade absolute bottom-6 right-8 hidden text-sm md:block ${
              scene.captionColor ?? "text-faint"
            }`}
            style={{
              textShadow: scene.captionColor === "text-white"
                ? "0 1px 3px rgba(0,0,0,0.55)"
                : "0 1px 3px rgba(250,250,248,0.65)",
            }}
          >
            {scene.caption}
          </span>
        )}
      </div>
    </main>
  );
}
