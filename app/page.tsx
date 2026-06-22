"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TopBar, type Mode } from "@/components/TopBar";
import EditorPanel from "@/components/panels/EditorPanel";
import { PerformanceMode } from "@/components/performance/PerformanceMode";
import { ForgeWorkspace } from "@/components/forge/ForgeWorkspace";

// React Flow touches browser only APIs, so the canvas renders client side.
const Canvas = dynamic(() => import("@/components/Canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-bone/40 font-mono text-sm">
      Loading the map...
    </div>
  ),
});

export default function Home() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  // Forge is the front door: get jokes down. Map and Run are secondary.
  const [mode, setMode] = useState<Mode>("forge");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-ink-900">
      <TopBar mode={mode} onModeChange={setMode} />
      {!hydrated ? (
        <div className="flex-1 flex items-center justify-center text-bone/40 font-mono text-sm">
          Restoring your boards...
        </div>
      ) : mode === "forge" ? (
        <ForgeWorkspace />
      ) : mode === "map" ? (
        <div className="flex-1 relative min-h-0">
          <Canvas />
          <EditorPanel />
        </div>
      ) : (
        <PerformanceMode />
      )}
    </main>
  );
}
