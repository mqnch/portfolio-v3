"use client";

import { useEffect, useState } from "react";

const MIN_HOLD = 1000;
const FADE_MS = 350;

export default function IntroVeil() {
  const [phase, setPhase] = useState<"show" | "fade" | "done">("show");

  useEffect(() => {
    // Already fully loaded (e.g. cached revisit) — don't bother showing the veil.
    if (document.readyState === "complete") {
      setPhase("done");
      return;
    }

    const start = performance.now();
    let fadeTimer: ReturnType<typeof setTimeout>;
    let doneTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      const wait = Math.max(0, MIN_HOLD - (performance.now() - start));
      fadeTimer = setTimeout(() => {
        setPhase("fade");
        doneTimer = setTimeout(() => setPhase("done"), FADE_MS);
      }, wait);
    };

    window.addEventListener("load", finish);
    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`intro-veil${phase === "fade" ? " intro-veil--out" : ""}`}
      aria-hidden="true"
    />
  );
}
