"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const MIN_THUMB = 28;

// A scroll container that hides the native scrollbar and draws its own thin
// overlay thumb. This is the only way to get a sub-"thin" bar in Firefox, which
// doesn't honor ::-webkit-scrollbar widths or pixel scrollbar-width values.
export default function ScrollArea({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ visible: false, height: 0, top: 0 });
  const dragRef = useRef<{ startY: number; startScroll: number; range: number } | null>(null);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    if (scrollHeight <= clientHeight + 1) {
      setThumb((t) => (t.visible ? { ...t, visible: false } : t));
      return;
    }
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * clientHeight);
    const maxTop = clientHeight - height;
    const range = scrollHeight - clientHeight;
    const top = range > 0 ? (scrollTop / range) * maxTop : 0;
    setThumb({ visible: true, height, top });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Track child resizes too (e.g. images loading in and growing the content).
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const el = scrollRef.current;
      if (!drag || !el || drag.range <= 0) return;
      const delta = e.clientY - drag.startY;
      el.scrollTop = drag.startScroll + (delta / drag.range) * (el.scrollHeight - el.clientHeight);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onThumbDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    dragRef.current = {
      startY: e.clientY,
      startScroll: el.scrollTop,
      range: el.clientHeight - thumb.height,
    };
  };

  return (
    <div className="relative">
      <div ref={scrollRef} onScroll={update} className={`scroll-none ${className}`}>
        {children}
      </div>
      {thumb.visible && (
        <div className="pointer-events-none absolute right-0.5 top-0 h-full w-2">
          <div
            onPointerDown={onThumbDown}
            className="pointer-events-auto absolute right-0 w-[3px] rounded-full bg-faint/45 transition-[background-color,width] hover:w-[5px] hover:bg-faint/80"
            style={{ height: thumb.height, top: thumb.top }}
          />
        </div>
      )}
    </div>
  );
}
