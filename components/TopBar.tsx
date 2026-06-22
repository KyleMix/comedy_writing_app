"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  boardToMarkdown,
  downloadText,
  setToMarkdown,
  setToPlainText,
} from "@/lib/export";
import { BoardPicker } from "./BoardPicker";
import { SettingsModal } from "./SettingsModal";

export function TopBar({
  mode,
  onModeChange,
}: {
  mode: "build" | "run";
  onModeChange: (m: "build" | "run") => void;
}) {
  const boardName = useStore((s) => s.boardName);
  const boardId = useStore((s) => s.boardId);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const viewport = useStore((s) => s.viewport);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  function currentBoard() {
    return {
      id: boardId ?? "",
      name: boardName,
      nodes,
      edges,
      viewport,
      createdAt: 0,
      updatedAt: 0,
    };
  }

  function safeName() {
    return boardName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "joke-forge";
  }

  return (
    <header className="h-14 shrink-0 border-b border-ink-600 bg-ink-900 flex items-center px-4 gap-3 z-30">
      <div className="flex items-center gap-2">
        <span className="font-display text-xl text-hazard tracking-tight">
          Joke Forge
        </span>
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="ml-2 px-3 py-1.5 rounded border border-ink-600 text-sm text-bone/80 hover:bg-ink-700 max-w-[220px] truncate"
        title="Switch board"
      >
        {boardName}
      </button>

      <div className="flex-1" />

      <div className="flex items-center rounded-lg border border-ink-600 overflow-hidden">
        <button
          onClick={() => onModeChange("build")}
          className={`px-3 py-1.5 text-sm font-mono ${
            mode === "build" ? "bg-hazard text-ink" : "text-bone/70"
          }`}
        >
          Build
        </button>
        <button
          onClick={() => onModeChange("run")}
          className={`px-3 py-1.5 text-sm font-mono ${
            mode === "run" ? "bg-hazard text-ink" : "text-bone/70"
          }`}
        >
          Run the set
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setExportOpen((v) => !v)}
          className="px-3 py-1.5 rounded border border-ink-600 text-sm text-bone/80 hover:bg-ink-700"
        >
          Export
        </button>
        {exportOpen && (
          <div
            className="absolute right-0 mt-2 w-56 bg-ink-800 border border-ink-600 rounded-lg shadow-bubble p-1 z-40"
            onMouseLeave={() => setExportOpen(false)}
          >
            <ExportItem
              label="Board to Markdown"
              onClick={() => {
                downloadText(
                  `${safeName()}-board.md`,
                  boardToMarkdown(currentBoard()),
                );
                setExportOpen(false);
              }}
            />
            <ExportItem
              label="Set to Markdown"
              onClick={() => {
                downloadText(
                  `${safeName()}-set.md`,
                  setToMarkdown(currentBoard()),
                );
                setExportOpen(false);
              }}
            />
            <ExportItem
              label="Set to plain text"
              onClick={() => {
                downloadText(
                  `${safeName()}-set.txt`,
                  setToPlainText(currentBoard()),
                );
                setExportOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => setSettingsOpen(true)}
        className="px-3 py-1.5 rounded border border-ink-600 text-sm text-bone/80 hover:bg-ink-700"
      >
        Settings
      </button>

      {pickerOpen && <BoardPicker onClose={() => setPickerOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}

function ExportItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-bone/80 hover:bg-ink-700 rounded"
    >
      {label}
    </button>
  );
}
