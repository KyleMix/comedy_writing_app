"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { aiEnabled, suggestAngles } from "@/lib/ai";
import type { QuestionType } from "@/lib/types";

// AI assist is additive only. The button is hidden when no key is set.
// Returned items render as candidates the comedian can keep or delete.

export function AiSuggest({
  parentId,
  premise,
  questionType,
  listing,
}: {
  parentId: string;
  premise: string;
  questionType?: QuestionType;
  listing?: boolean;
}) {
  const settings = useStore((s) => s.settings);
  const addIdeaChild = useStore((s) => s.addIdeaChild);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);

  if (!aiEnabled(settings)) return null;

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const out = await suggestAngles(settings, {
        premise,
        questionType,
        listing,
      });
      setCandidates(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  function keep(text: string) {
    addIdeaChild(parentId, text, listing ? { listingCategory: undefined } : {});
    setCandidates((c) => c.filter((x) => x !== text));
  }

  function drop(text: string) {
    setCandidates((c) => c.filter((x) => x !== text));
  }

  return (
    <div className="mt-4 border-t border-ink-600 pt-3">
      <button
        onClick={run}
        disabled={loading}
        className="text-xs font-mono px-3 py-1.5 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink disabled:opacity-50 transition-colors"
      >
        {loading ? "Thinking..." : "AI suggest"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-400 font-mono break-words">
          {error}
        </p>
      )}
      {candidates.length > 0 && (
        <ul className="mt-3 space-y-2">
          {candidates.map((c) => (
            <li
              key={c}
              className="flex items-start gap-2 bg-ink-700 rounded p-2 text-sm"
            >
              <span className="flex-1 text-bone/90">{c}</span>
              <button
                onClick={() => keep(c)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-hazard text-ink"
              >
                KEEP
              </button>
              <button
                onClick={() => drop(c)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-500 text-bone/60"
              >
                DROP
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
