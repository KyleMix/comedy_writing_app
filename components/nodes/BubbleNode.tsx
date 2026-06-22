"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { JokeNode, NodeKind } from "@/lib/types";

// One renderer for every bubble kind. Hubs read larger and bolder than
// leaf nodes. Confirmed jokes and the active path get the hazard border.

const KIND_META: Record<
  NodeKind,
  { tag: string; accentText: string }
> = {
  premise: { tag: "PREMISE", accentText: "text-hazard" },
  story: { tag: "STORY", accentText: "text-bone" },
  question: { tag: "QUESTION", accentText: "text-hazard" },
  idea: { tag: "IDEA", accentText: "text-bone" },
  listing: { tag: "LISTING", accentText: "text-hazard" },
  analogy: { tag: "ANALOGY", accentText: "text-hazard" },
  cliche: { tag: "CLICHE", accentText: "text-hazard" },
  joke: { tag: "JOKE", accentText: "text-hazard" },
};

export type BubbleData = {
  node: JokeNode;
  selected: boolean;
};

export function BubbleNode({ data }: NodeProps) {
  const { node, selected } = data as unknown as BubbleData;
  const meta = KIND_META[node.kind];
  const isHub = node.kind === "premise";
  const confirmed = node.kind === "joke" || node.confirmed;

  const borderClass = selected
    ? "border-hazard shadow-hazard"
    : confirmed
      ? "border-hazard"
      : "border-ink-500";

  const sizeClass = isHub
    ? "min-w-[220px] max-w-[300px] px-5 py-4"
    : "min-w-[150px] max-w-[230px] px-4 py-3";

  const display = node.body || node.title || placeholderFor(node.kind);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`relative rounded-2xl border-2 ${borderClass} ${sizeClass} ${
        isHub ? "bg-ink-700" : "bg-ink-800"
      } shadow-bubble cursor-pointer select-none`}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className={`text-[10px] font-mono tracking-widest ${meta.accentText}`}
        >
          {meta.tag}
        </span>
        {node.inSet && (
          <span className="text-[9px] font-mono text-ink-DEFAULT bg-hazard px-1.5 py-0.5 rounded">
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
