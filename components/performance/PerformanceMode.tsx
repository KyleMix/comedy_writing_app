"use client";

import { useState } from "react";
import { SetBuilder } from "./SetBuilder";
import { RecallCards } from "./RecallCards";
import { Teleprompter } from "./Teleprompter";

type View = "set" | "recall";

export function PerformanceMode() {
  const [view, setView] = useState<View>("set");
  const [teleprompter, setTeleprompter] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="h-12 shrink-0 border-b border-ink-600 bg-ink-900 flex items-center px-4 gap-2">
        <div className="flex items-center rounded-lg border border-ink-600 overflow-hidden">
          <button
            onClick={() => setView("set")}
            className={`px-3 py-1.5 text-sm font-mono ${
              view === "set" ? "bg-hazard text-ink" : "text-bone/70"
            }`}
          >
            Set builder
          </button>
          <button
            onClick={() => setView("recall")}
            className={`px-3 py-1.5 text-sm font-mono ${
              view === "recall" ? "bg-hazard text-ink" : "text-bone/70"
            }`}
          >
            Recall drill
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setTeleprompter(true)}
          className="px-3 py-1.5 rounded bg-hazard text-ink font-mono text-sm"
        >
          Teleprompter
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {view === "set" ? <SetBuilder /> : <RecallCards />}
      </div>

      {teleprompter && (
        <Teleprompter onExit={() => setTeleprompter(false)} />
      )}
    </div>
  );
}
