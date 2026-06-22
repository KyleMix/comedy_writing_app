"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { JokeNode } from "@/lib/types";

// A memorization drill. Show the setup line, hide the tag, let the comedian
// recall it, then reveal. Beats they miss carry a higher miss count and get
// resurfaced first on the next run. No heavy spaced repetition library.

function splitSetupTag(text: string): { setup: string; tag: string } {
  const match = text.match(/^(.*[.,:?!])\s+(.+)$/s);
  if (match && match[1].trim() && match[2].trim()) {
    return { setup: match[1].trim(), tag: match[2].trim() };
  }
  // Single beat with no clear split: the whole line is the tag to recall.
  return { setup: "", tag: text };
}

function buildQueue(nodes: JokeNode[]): JokeNode[] {
  return nodes
    .filter((n) => n.inSet)
    .sort((a, b) => {
      const miss = (b.recallMisses ?? 0) - (a.recallMisses ?? 0);
      if (miss !== 0) return miss; // resurface missed beats first
      return (a.order ?? 0) - (b.order ?? 0);
    });
}

export function RecallCards() {
  const nodes = useStore((s) => s.nodes);
  const updateNode = useStore((s) => s.updateNode);

  const [queue, setQueue] = useState<JokeNode[]>(() => buildQueue(nodes));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const current = queue[pos];

  function restart() {
    setQueue(buildQueue(useStore.getState().nodes));
    setPos(0);
    setRevealed(false);
    setDone(false);
  }

  function next(missed: boolean) {
    if (!current) return;
    if (missed) {
      updateNode(current.id, {
        recallMisses: (current.recallMisses ?? 0) + 1,
      });
    } else {
      updateNode(current.id, {
        recallMisses: Math.max(0, (current.recallMisses ?? 0) - 1),
      });
    }
    if (pos + 1 >= queue.length) {
      setDone(true);
    } else {
      setPos(pos + 1);
      setRevealed(false);
    }
  }

  if (queue.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-bone/50 font-mono">
          The set is empty. Build a set to drill it.
        </p>
      </div>
    );
  }

  if (done) {
    const remaining = buildQueue(nodes).filter(
      (n) => (n.recallMisses ?? 0) > 0,
    );
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <h2 className="font-display text-3xl text-bone">Run complete</h2>
        <p className="text-bone/60 font-mono text-sm">
          {remaining.length === 0
            ? "Clean run. Every beat landed."
            : `${remaining.length} beat(s) still shaky. They come up first next run.`}
        </p>
        <button
          onClick={restart}
          className="px-4 py-2 rounded bg-hazard text-ink font-mono text-sm"
        >
          Run again
        </button>
      </div>
    );
  }

  const { setup, tag } = splitSetupTag(current.body || current.title);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <p className="font-mono text-xs text-bone/40">
        Card {pos + 1} / {queue.length}
        {(current.recallMisses ?? 0) > 0 && (
          <span className="text-hazard"> · shaky beat</span>
        )}
      </p>

      <div className="w-full max-w-2xl bg-ink-800 border border-ink-600 rounded-2xl p-8 min-h-[240px] flex flex-col justify-center">
        {setup ? (
          <p className="font-mono text-2xl text-bone/90 leading-relaxed">
            {setup}
          </p>
        ) : (
          <p className="font-mono text-sm text-bone/40 uppercase tracking-widest">
            Recall this beat
          </p>
        )}

        {revealed ? (
          <p className="mt-6 font-mono text-2xl text-hazard leading-relaxed">
            {tag}
          </p>
        ) : (
          <p className="mt-6 font-mono text-2xl text-bone/10 select-none blur-sm">
            {tag || "hidden"}
          </p>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="px-6 py-2.5 rounded bg-hazard text-ink font-mono text-sm"
        >
          Reveal
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => next(true)}
            className="px-6 py-2.5 rounded border border-red-500/60 text-red-400 font-mono text-sm hover:bg-red-500/10"
          >
            Missed it
          </button>
          <button
            onClick={() => next(false)}
            className="px-6 py-2.5 rounded bg-hazard text-ink font-mono text-sm"
          >
            Nailed it
          </button>
        </div>
      )}
    </div>
  );
}
