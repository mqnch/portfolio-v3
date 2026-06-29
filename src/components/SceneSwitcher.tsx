"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scenes, links, defaultImage } from "@/app/scenes";
import ImageEngine from "@/components/ImageEngine";

const COOLDOWN = 200;
const WHEEL_THRESHOLD = 10;
const SWIPE_THRESHOLD = 50;

export default function SceneSwitcher() {
  const [current, setCurrent] = useState(0);
  const scene = scenes[current];

  const lockedRef = useRef(false);
  // Set while an expanded project (or other overlay) wants to own scrolling and
  // keyboard nav, so we don't switch scenes out from under it.
  const navLockedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    lockedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lockedRef.current = false;
    }, COOLDOWN);
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
    const step = (delta: number) => {
      if (lockedRef.current) return;
      setCurrent((prev) => {
        const next = Math.max(0, Math.min(scenes.length - 1, prev + delta));
        if (next === prev) return prev;
        lock();
        return next;
      });
    };

    const onWheel = (e: WheelEvent) => {
      // Let an open project scroll its own content instead of switching scenes.
      if (navLockedRef.current) return;
      if (Math.abs(e.deltaY) <= WHEEL_THRESHOLD) return;
      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1);
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
    };
  }, [lock]);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 md:pointer-events-auto md:left-1/3">
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

      <div className="relative z-10 flex h-full flex-col px-6 py-10 md:w-1/3 md:px-16 md:py-14">
        <header className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">felix pan</h1>
        </header>

        <div className="flex flex-1 items-center">
          <div key={scene.id} className="fade w-full max-w-md space-y-6">
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
            {links.map((link) =>
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
    </main>
  );
}
