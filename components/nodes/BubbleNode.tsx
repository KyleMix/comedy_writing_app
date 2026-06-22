"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { JokeNode, NodeKind } from "@/lib/types";
import { kindStyle } from "@/lib/kindStyles";

// One renderer for every bubble kind. Each kind carries a colored accent bar
// and label so the board is scannable at a glance. Hubs read larger and
// bolder. The hazard ring is reserved for selection, and the hazard border
// for confirmed jokes, so the active path stays the dominant signal.

export type BubbleData = {
  node: JokeNode;
  selected: boolean;
};

export function BubbleNode({ data }: NodeProps) {
  const { node, selected } = data as unknown as BubbleData;
  const meta = kindStyle(node.kind);
  const isHub = node.kind === "premise";
  const confirmed = node.kind === "joke" || node.confirmed;

  const borderClass = selected
    ? "border-hazard shadow-hazard"
    : confirmed
      ? "border-hazard/80"
      : "border-ink-600";

  const sizeClass = isHub
    ? "min-w-[230px] max-w-[310px] pl-6 pr-5 py-4"
    : "min-w-[160px] max-w-[240px] pl-5 pr-4 py-3";

  const display = node.body || node.title || placeholderFor(node.kind);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`relative rounded-2xl border ${borderClass} ${sizeClass} ${
        isHub ? "bg-ink-700" : "bg-ink-800"
      } shadow-bubble cursor-pointer select-none`}
    >
      {/* Left accent bar in the kind color, readable even when zoomed out.
          Rounded on the left to follow the card corners without clipping the
          connection handles. */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: meta.color, opacity: confirmed ? 1 : 0.85 }}
      />
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span
            className="text-[10px] font-mono tracking-[0.18em]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </span>
        {node.inSet && (
          <span className="text-[9px] font-mono font-semibold text-ink-900 bg-hazard px-1.5 py-0.5 rounded">
            IN SET
          </span>
        )}
      </div>
      <p
        className={`leading-snug break-words ${
          isHub
            ? "font-display text-lg text-bone"
            : node.kind === "joke"
              ? "font-mono text-sm text-bone"
              : "font-body text-sm text-bone/90"
        } ${node.body ? "" : "italic text-bone/40"}`}
      >
        {display}
      </p>
      {node.kind === "analogy" && (
        <div className="mt-2 flex gap-1.5 text-[9px] font-mono">
          <span
            className={`px-1.5 py-0.5 rounded border ${
              node.trueForSubject
                ? "border-hazard text-hazard"
                : "border-ink-500 text-bone/40"
            }`}
          >
            SUBJ {node.trueForSubject ? "✓" : "·"}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border ${
              node.trueForElement
                ? "border-hazard text-hazard"
                : "border-ink-500 text-bone/40"
            }`}
          >
            ELEM {node.trueForElement ? "✓" : "·"}
          </span>
        </div>
      )}
      {(node.tagType || node.physical || node.callback) && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-mono">
          {node.tagType && (
            <span className="px-1.5 py-0.5 rounded border border-hazard text-hazard">
              {node.tagType.toUpperCase()}
            </span>
          )}
          {node.physical && (
            <span className="px-1.5 py-0.5 rounded border border-bone/40 text-bone/60">
              ACT OUT
            </span>
          )}
          {node.callback && (
            <span className="px-1.5 py-0.5 rounded border border-bone/40 text-bone/60">
              CALLBACK
            </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </motion.div>
  );
}

function placeholderFor(kind: NodeKind): string {
  switch (kind) {
    case "premise":
      return "Type your premise. The thing the joke is about.";
    case "question":
      return "Open to answer this question.";
    case "listing":
      return "Mine an element for connections.";
    case "analogy":
      return "Build a forced analogy.";
    case "cliche":
      return "Reform a cliche.";
    case "story":
      return "Write the story straight.";
    case "idea":
      return "An idea.";
    case "joke":
      return "A confirmed joke.";
    default:
      return "";
  }
}
