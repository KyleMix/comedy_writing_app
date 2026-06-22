"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";

// Full screen teleprompter. JetBrains Mono, large type, dark background.
// Accent marks the current beat. Space or tap advances. Scroll speed
// adjusts the auto advance interval.

export function Teleprompter({ onExit }: { onExit: () => void }) {
  const nodes = useStore((s) => s.nodes);
  const beats = useMemo(
    () =>
      nodes
        .filter((n) => n.inSet)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [nodes],
  );

  const [index, setIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [speed, setSpeed] = useState(6); // seconds per beat
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const advance = useMemo(
    () => () => setIndex((i) => Math.min(i + 1, beats.length - 1)),
    [beats.length],
  );
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.code === "Escape") {
        onExit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onExit]);

  useEffect(() => {
    if (!autoScroll) return;
    const t = setInterval(() => advance(), speed * 1000);
    return () => clearInterval(t);
  }, [autoScroll, speed, advance]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [index]);

  if (beats.length === 0) {
    return (
      <div className="fixed inset-0 bg-ink-900 z-50 flex flex-col items-center justify-center gap-4">
        <p className="text-bone/60 font-mono">
          The set is empty. Build a set first.
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded border border-hazard text-hazard font-mono text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-ink-900 z-50 flex flex-col"
      onClick={advance}
    >
      <div className="flex items-center justify-between px-6 py-3 border-b border-ink-700">
        <span className="font-mono text-hazard text-sm">
          Beat {index + 1} / {beats.length}
        </span>
        <div
          className="flex items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="flex items-center gap-2 text-xs font-mono text-bone/60">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            auto
          </label>
          <label className="flex items-center gap-2 text-xs font-mono text-bone/60">
            speed
            <input
              type="range"
              min={2}
              max={20}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="accent-hazard"
            />
            {speed}s
          </label>
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded border border-ink-600 text-bone/70 font-mono text-sm hover:bg-ink-700"
          >
            Exit
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto panel-scroll px-8 py-24"
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {beats.map((beat, i) => (
            <div
              key={beat.id}
              ref={i === index ? activeRef : undefined}
              className={`font-mono leading-relaxed transition-all duration-300 ${
                i === index
                  ? "text-hazard text-5xl"
                  : i < index
                    ? "text-bone/25 text-3xl"
                    : "text-bone/50 text-3xl"
              }`}
            >
              {beat.body || beat.title}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-3 border-t border-ink-700 text-center text-xs font-mono text-bone/40">
        Space or tap to advance. Arrow keys to step. Esc to exit.
      </div>
    </div>
  );
}
