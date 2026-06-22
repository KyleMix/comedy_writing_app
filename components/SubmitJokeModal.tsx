"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import { ActionButton } from "./ui";

// Paste a full, finished joke. The app derives the premise, keeps the whole
// joke in a story node, splits the setup sentences into taggable beats,
// confirms the last line as the punchline, and spawns the improvement
// bubbles so you can start punching it up.

export function SubmitJokeModal({
  onSubmitted,
  onClose,
}: {
  onSubmitted: () => void;
  onClose: () => void;
}) {
  const submitFullJoke = useStore((s) => s.submitFullJoke);
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    submitFullJoke(text);
    onSubmitted();
  }

  return (
    <Modal title="Submit a full joke" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-bone/60">
          Paste a joke you already have. It gets broken into the premise, the
          full text, the setup beats, and the punchline, then categorized into
          the ways to improve it: the three questions, the listing method, and
          the weirder angles.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={
            "I am home teaching my daughter how to tie her shoes. Which is weird. She is 17."
          }
          className="w-full bg-ink-900 border border-ink-600 rounded-lg p-3 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none resize-y font-mono text-sm"
        />
        <div className="flex gap-2">
          <ActionButton onClick={submit} variant="accent" disabled={!text.trim()}>
            Break it down
          </ActionButton>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
        </div>
        <p className="text-[11px] text-bone/40">
          The first sentence seeds the premise. The last sentence becomes the
          confirmed punchline. You can edit any of it on the board.
        </p>
      </div>
    </Modal>
  );
}
