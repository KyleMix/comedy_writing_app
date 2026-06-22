"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import { ActionButton } from "./ui";

export function BoardPicker({ onClose }: { onClose: () => void }) {
  const boards = useStore((s) => s.boards);
  const boardId = useStore((s) => s.boardId);
  const createBoard = useStore((s) => s.createBoard);
  const switchBoard = useStore((s) => s.switchBoard);
  const renameBoard = useStore((s) => s.renameBoard);
  const duplicateBoard = useStore((s) => s.duplicateBoard);
  const removeBoard = useStore((s) => s.removeBoard);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  return (
    <Modal title="Boards" onClose={onClose}>
      <div className="space-y-2">
        <ActionButton
          onClick={async () => {
            await createBoard("Untitled set");
            onClose();
          }}
          variant="accent"
        >
          New board
        </ActionButton>

        <ul className="mt-3 space-y-2">
          {boards.map((b) => (
            <li
              key={b.id}
              className={`rounded-lg border p-3 ${
                b.id === boardId
                  ? "border-hazard bg-ink-700"
                  : "border-ink-600 bg-ink-900"
              }`}
            >
              {renamingId === b.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void renameBoard(b.id, renameValue);
                        setRenamingId(null);
                      }
                    }}
                    className="flex-1 bg-ink-900 border border-ink-600 rounded px-2 py-1 text-sm text-bone focus:border-hazard focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      void renameBoard(b.id, renameValue);
                      setRenamingId(null);
                    }}
                    className="text-xs font-mono text-hazard"
                  >
                    save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={async () => {
                      await switchBoard(b.id);
                      onClose();
                    }}
                    className="flex-1 text-left text-sm text-bone truncate"
                  >
                    {b.name}
                  </button>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-bone/50">
                    <button
                      onClick={() => {
                        setRenamingId(b.id);
                        setRenameValue(b.name);
                      }}
                      className="hover:text-bone"
                    >
                      rename
                    </button>
                    <button
                      onClick={() => void duplicateBoard(b.id)}
                      className="hover:text-bone"
                    >
                      duplicate
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(`Delete "${b.name}"? This cannot be undone.`)
                        ) {
                          void removeBoard(b.id);
                        }
                      }}
                      className="hover:text-red-400"
                    >
                      delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
