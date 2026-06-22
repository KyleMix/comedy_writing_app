"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { JokeNode } from "@/lib/types";

// Drag confirmed jokes (and opted in ideas) into an ordered path from the
// small quips to the big joke. A live laughs per minute feel is derived
// from tag count over the estimated running time.

export function SetBuilder() {
  const nodes = useStore((s) => s.nodes);
  const updateNode = useStore((s) => s.updateNode);
  const toggleInSet = useStore((s) => s.toggleInSet);

  const inSet = useMemo(
    () =>
      nodes
        .filter((n) => n.inSet)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [nodes],
  );

  const candidates = useMemo(
    () =>
      nodes.filter(
        (n) =>
          !n.inSet &&
          (n.kind === "joke" || n.kind === "idea") &&
          (n.body.trim().length > 0),
      ),
    [nodes],
  );

  const totalSeconds = inSet.reduce((s, n) => s + (n.beatSeconds ?? 20), 0);
  const minutes = totalSeconds / 60;
  const lpm = minutes > 0 ? (inSet.length / minutes).toFixed(1) : "0.0";

  const callbacks = useMemo(
    () =>
      inSet
        .map((n, i) => ({ ...n, pos: i + 1 }))
        .filter((n) => n.callback),
    [inSet],
  );

  function reorder(node: JokeNode, dir: -1 | 1) {
    const idx = inSet.findIndex((n) => n.id === node.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= inSet.length) return;
    const a = inSet[idx];
    const b = inSet[swapIdx];
    const aOrder = a.order ?? 0;
    const bOrder = b.order ?? 0;
    updateNode(a.id, { order: bOrder });
    updateNode(b.id, { order: aOrder });
  }

  return (
    <div className="grid grid-cols-2 gap-6 p-6 h-full overflow-y-auto panel-scroll">
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-2xl text-bone">The set</h2>
          <div className="text-right">
            <p className="font-mono text-hazard text-lg leading-none">
              {lpm} <span className="text-xs">tags/min</span>
            </p>
            <p className="font-mono text-bone/50 text-xs mt-1">
              {inSet.length} beats, {Math.round(totalSeconds)}s estimated
            </p>
          </div>
        </div>

        {callbacks.length > 0 && (
          <div className="mb-3 bg-ink-900 border border-ink-600 rounded-lg p-3">
            <p className="text-[10px] font-mono tracking-widest text-hazard mb-1">
              CALLBACKS IN THIS SET
            </p>
            <p className="text-[11px] text-bone/50 mb-2">
              Free laughs, as long as the image is planted earlier than its
              payoff. Place these where the audience already knows the
              reference.
            </p>
            <ul className="space-y-1">
              {callbacks.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 text-xs font-mono text-bone/70"
                >
                  <span className="text-hazard">#{c.pos}</span>
                  <span className="truncate">{c.body || c.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {inSet.length === 0 ? (
          <p className="text-sm text-bone/50">
            Nothing in the set yet. Add confirmed jokes or ideas from the
            candidates on the right.
          </p>
        ) : (
          <ol className="space-y-2">
            {inSet.map((n, i) => (
              <li
                key={n.id}
                className="bg-ink-800 border border-ink-600 rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-hazard text-sm w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-bone/90">
                      {n.body || n.title}
                    </p>
                    {(n.tagType || n.physical || n.callback) && (
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-mono">
                        {n.tagType && (
                          <span className="px-1.5 py-0.5 rounded border border-hazard text-hazard">
                            {n.tagType.toUpperCase()}
                          </span>
                        )}
                        {n.physical && (
                          <span className="px-1.5 py-0.5 rounded border border-bone/40 text-bone/60">
                            ACT OUT
                          </span>
                        )}
                        {n.callback && (
                          <span className="px-1.5 py-0.5 rounded border border-bone/40 text-bone/60">
                            CALLBACK
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pl-8">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-mono text-bone/40">
                      SECONDS
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={n.beatSeconds ?? 20}
                      onChange={(e) =>
                        updateNode(n.id, {
                          beatSeconds: Math.max(1, Number(e.target.value) || 0),
                        })
                      }
                      className="w-16 bg-ink-900 border border-ink-600 rounded px-2 py-0.5 text-xs text-bone font-mono focus:border-hazard focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-bone/50">
                    <button
                      onClick={() => reorder(n, -1)}
                      className="hover:text-bone"
                    >
                      up
                    </button>
                    <button
                      onClick={() => reorder(n, 1)}
                      className="hover:text-bone"
                    >
                      down
                    </button>
                    <button
                      onClick={() => toggleInSet(n.id)}
                      className="hover:text-red-400"
                    >
                      remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-bone mb-3">Candidates</h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-bone/50">
            No candidates. Confirm jokes on the board, or mark ideas to include.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-2 bg-ink-900 border border-ink-600 rounded-lg p-3"
              >
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded self-start ${
                    n.kind === "joke"
                      ? "bg-hazard text-ink"
                      : "border border-ink-500 text-bone/50"
                  }`}
                >
                  {n.kind.toUpperCase()}
                </span>
                <p className="flex-1 text-sm text-bone/80">
                  {n.body || n.title}
                </p>
                <button
                  onClick={() => toggleInSet(n.id)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink"
                >
                  ADD
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
