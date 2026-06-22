"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  boardToHtml,
  boardToMarkdown,
  downloadText,
  setToHtml,
  setToMarkdown,
  setToPlainText,
} from "@/lib/export";
import { saveToGoogleDocs } from "@/lib/googleDocs";
import { BoardPicker } from "./BoardPicker";
import { SettingsModal } from "./SettingsModal";
import { SubmitJokeModal } from "./SubmitJokeModal";

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
  const [submitOpen, setSubmitOpen] = useState(false);
  const settings = useStore((s) => s.settings);
  const [gdocsBusy, setGdocsBusy] = useState(false);
  const [gdocsError, setGdocsError] = useState<string | null>(null);

  async function saveToDocs(kind: "set" | "board") {
    setGdocsBusy(true);
    setGdocsError(null);
    try {
      const board = currentBoard();
      const html = kind === "set" ? setToHtml(board) : boardToHtml(board);
      const name =
        kind === "set" ? `${board.name}: the set` : board.name;
      const doc = await saveToGoogleDocs(settings.googleClientId, name, html);
      window.open(doc.webViewLink, "_blank", "noopener");
      setExportOpen(false);
    } catch (e) {
      setGdocsError(e instanceof Error ? e.message : "Could not save to Docs.");
    } finally {
      setGdocsBusy(false);
    }
  }

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
    <header className="h-16 shrink-0 border-b border-ink-600 bg-ink-900 flex items-center px-4 gap-4 z-30 shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="w-6 h-6 rounded-md bg-hazard flex items-center justify-center"
        >
          <span className="text-ink-900 font-display font-black text-sm leading-none">
            J
          </span>
        </span>
        <span className="font-display text-xl text-bone tracking-tight">
          Joke Forge
        </span>
      </div>

      <span className="h-6 w-px bg-ink-600" aria-hidden />

      <button
        onClick={() => setPickerOpen(true)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-600 text-sm text-bone/80 hover:bg-ink-700 hover:border-ink-500 max-w-[240px] transition-colors"
        title="Switch board"
      >
        <span className="text-[10px] font-mono tracking-widest text-bone-muted group-hover:text-hazard transition-colors">
          BOARD
        </span>
        <span className="truncate">{boardName}</span>
      </button>

      <button
        onClick={() => setSubmitOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hazard text-ink-900 text-sm font-mono font-semibold hover:bg-hazard/85 transition-colors"
        title="Paste a full joke and break it down"
      >
        + Submit joke
      </button>

      <div className="flex-1" />

      <div className="flex items-center rounded-lg border border-ink-600 overflow-hidden">
        <button
          onClick={() => onModeChange("build")}
          className={`px-3.5 py-1.5 text-sm font-mono transition-colors ${
            mode === "build"
              ? "bg-hazard text-ink-900"
              : "text-bone/70 hover:bg-ink-700"
          }`}
        >
          Build
        </button>
        <button
          onClick={() => onModeChange("run")}
          className={`px-3.5 py-1.5 text-sm font-mono transition-colors ${
            mode === "run"
              ? "bg-hazard text-ink-900"
              : "text-bone/70 hover:bg-ink-700"
          }`}
        >
          Run the set
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setExportOpen((v) => !v)}
          className="px-3 py-1.5 rounded-lg border border-ink-600 text-sm text-bone/80 hover:bg-ink-700 hover:border-ink-500 transition-colors"
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
            {settings.googleClientId.trim() ? (
              <>
                <div className="my-1 border-t border-ink-600" />
                <ExportItem
                  label={gdocsBusy ? "Saving to Docs..." : "Set to Google Docs"}
                  onClick={() => saveToDocs("set")}
                  disabled={gdocsBusy}
                />
                <ExportItem
                  label={
                    gdocsBusy ? "Saving to Docs..." : "Board to Google Docs"
                  }
                  onClick={() => saveToDocs("board")}
                  disabled={gdocsBusy}
                />
                {gdocsError && (
                  <p className="px-3 py-2 text-[11px] text-red-400 font-mono break-words">
                    {gdocsError}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="my-1 border-t border-ink-600" />
                <p className="px-3 py-2 text-[11px] text-bone/40">
                  Add a Google OAuth client ID in Settings to save to Google
                  Docs.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setSettingsOpen(true)}
        className="px-3 py-1.5 rounded-lg border border-ink-600 text-sm text-bone/80 hover:bg-ink-700 hover:border-ink-500 transition-colors"
      >
        Settings
      </button>

      {pickerOpen && <BoardPicker onClose={() => setPickerOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {submitOpen && (
        <SubmitJokeModal
          onSubmitted={() => {
            setSubmitOpen(false);
            onModeChange("build");
          }}
          onClose={() => setSubmitOpen(false)}
        />
      )}
    </header>
  );
}

function ExportItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-3 py-2 text-sm text-bone/80 hover:bg-ink-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}
