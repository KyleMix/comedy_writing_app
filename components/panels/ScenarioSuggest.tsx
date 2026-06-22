"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { aiEnabled, suggestScenariosAI } from "@/lib/ai";
import { suggestScenarios } from "@/lib/specialize";

// Suggests similar scenarios and moves that can push the joke along. Works
// fully offline from the premise text, and sharpens with AI when a key is
// set. Each suggestion can be kept as an idea bubble or branched straight
// into its own premise hub.

export function ScenarioSuggest({
  parentId,
  premise,
}: {
  parentId: string;
  premise: string;
}) {
  const settings = useStore((s) => s.settings);
  const addIdeaChild = useStore((s) => s.addIdeaChild);
  const promoteToPremise = useStore((s) => s.promoteToPremise);

  const offline = useMemo(() => suggestScenarios(premise), [premise]);
  const [aiItems, setAiItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState<Set<string>>(new Set());

  if (!premise.trim()) return null;

  const items = [...aiItems, ...offline].filter((x) => !used.has(x));

  function markUsed(text: string) {
    setUsed((u) => new Set(u).add(text));
  }

  function keep(text: string) {
    addIdeaChild(parentId, text);
    markUsed(text);
  }

  function branch(text: string) {
    const id = addIdeaChild(parentId, text);
    if (id) promoteToPremise(id);
    markUsed(text);
  }

  async function sharpen() {
    setLoading(true);
    setError(null);
    try {
      const out = await suggestScenariosAI(settings, premise);
      setAiItems(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-ink-600 pt-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg text-bone leading-tight">
          Similar scenarios
        </h3>
        {aiEnabled(settings) && (
          <button
            onClick={sharpen}
            disabled={loading}
            className="text-xs font-mono px-2.5 py-1 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink-900 disabled:opacity-50 transition-colors"
          >
            {loading ? "Thinking..." : "Sharpen with AI"}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-bone/50">
        Adjacent situations and moves that push the joke along. Keep one as an
        idea, or branch it into its own premise.
      </p>
      {error && (
        <p className="mt-2 text-xs text-red-400 font-mono break-words">
          {error}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {items.map((s) => (
          <li
            key={s}
            className="flex items-start gap-2 bg-ink-900 border border-ink-600 rounded-lg p-2.5 text-sm"
          >
            <span className="flex-1 text-bone/85">{s}</span>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => keep(s)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-hazard text-ink-900"
                title="Add as an idea bubble"
              >
                KEEP
              </button>
              <button
                onClick={() => branch(s)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-500 text-bone/60 hover:text-bone"
                title="Spin this into its own premise hub"
              >
                BRANCH
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
