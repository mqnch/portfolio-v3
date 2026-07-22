"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  scenes as defaultScenes,
  links,
  defaultImage,
  sceneIndexFromPath,
  type Scene,
} from "@/app/scenes";
import ImageEngine from "@/components/ImageEngine";

type SceneSwitcherProps = {
  children: ReactNode;
  scenes?: Scene[];
  title?: string;
  footerLinks?: { label: string; href: string | null }[];
};

const COOLDOWN = 200;
// Ignore micro-noise; mouse notches are often small in pixel mode.
const WHEEL_THRESHOLD = 1;
// After a step, ignore wheel input so trackpad inertia (falling velocity) cannot
// chain extra scenes. Fixed window so a later intentional swipe can fire again.
const WHEEL_COOLDOWN = 450;
// Quiet long enough to treat the next impulse as a fresh rising edge.
const WHEEL_IDLE_MS = 120;
const SWIPE_THRESHOLD = 25;

function wheelMagnitude(e: WheelEvent) {
  const abs = Math.abs(e.deltaY);
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return abs * 16;
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE)
    return abs * (typeof window !== "undefined" ? window.innerHeight : 800);
  return abs;
}

export default function SceneSwitcher({
  children,
  scenes = defaultScenes,
  title = "felix pan",
  footerLinks = links,
}: SceneSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current = sceneIndexFromPath(pathname);
  const scene = scenes[current] ?? scenes[0];

  const lockedRef = useRef(false);
  // Set while an expanded project (or other overlay) wants to own scrolling and
  // keyboard nav, so we don't switch scenes out from under it.
  const navLockedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep current index readable inside stable event handlers without rebinding.
  const currentRef = useRef(current);
  currentRef.current = current;

  const lock = useCallback((ms = COOLDOWN) => {
    lockedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lockedRef.current = false;
    }, ms);
  }, []);

  const goToScene = useCallback(
    (index: number, cooldown = COOLDOWN) => {
      const next = Math.max(0, Math.min(scenes.length - 1, index));
      if (next === currentRef.current) return;
      lock(cooldown);
      router.push(scenes[next].href);
    },
    [lock, router, scenes]
  );

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
      goToScene(currentRef.current + delta, cooldown);
    };

    let lastMag = 0;
    let lastSign = 0;
    let lastWheelAt = 0;

    const onWheel = (e: WheelEvent) => {
      // Let an open project scroll its own content instead of switching scenes.
      if (navLockedRef.current) return;

      const mag = wheelMagnitude(e);
      if (mag <= WHEEL_THRESHOLD) return;
      e.preventDefault();

      const now = performance.now();
      const sign = e.deltaY > 0 ? 1 : -1;

      // Keep tracking magnitude while locked so unlock mid-inertia sees a
      // falling edge (mag <= lastMag) instead of a false "fresh" rise.
      if (lockedRef.current) {
        lastMag = mag;
        lastSign = sign;
        lastWheelAt = now;
        return;
      }

      if (now - lastWheelAt > WHEEL_IDLE_MS || sign !== lastSign) {
        lastMag = 0;
      }
      lastWheelAt = now;

      // Rising velocity/impulse vs the previous tick(s): mouse notch from idle,
      // or the accelerating start of a trackpad swipe. Falling inertia will not.
      const rising = mag > lastMag;
      lastMag = mag;
      lastSign = sign;

      if (rising) {
        step(sign, WHEEL_COOLDOWN);
      }
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
  }, [goToScene]);

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden md:flex-row">
      <div className="text-panel relative z-10 flex h-full flex-col overflow-x-hidden px-6 py-10 md:px-16 md:py-14">
        <header className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            <Link
              href="/"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="select-none hover:opacity-80"
            >
              {title}
            </Link>
          </h1>
        </header>

        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <div key={scene.id} className="fade w-full min-w-0 space-y-6">
            {children}
          </div>
        </div>

        <footer className="space-y-4">
          <nav className="flex items-center gap-5 text-sm italic">
            {scenes.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                aria-current={s.id === scene.id ? "page" : undefined}
                onClick={() => {
                  if (s.id !== scene.id) lock();
                }}
                className={`select-none underline-offset-4 transition-colors hover:underline ${
                  s.id === scene.id ? "text-foreground" : "text-faint hover:text-muted"
                }`}
              >
                {s.label}
              </Link>
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
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="select-none underline-offset-4 hover:text-foreground hover:underline"
                >
                  {link.label}
                </a>
              ) : (
                <span key={link.label} className="text-faint select-none">
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
              textShadow:
                scene.captionColor === "text-white"
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
