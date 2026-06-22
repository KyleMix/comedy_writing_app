import type { JokeNode, Board } from "./types";
import { stripDashes } from "./utils";

// Export a board to Markdown. The set export reads like a performable script.
// No em dashes anywhere.

const KIND_LABEL: Record<string, string> = {
  premise: "Premise",
  story: "Story",
  question: "Question",
  idea: "Idea",
  listing: "Listing",
  analogy: "Analogy",
  cliche: "Cliche",
  joke: "Joke",
};

export function boardToMarkdown(board: Board): string {
  const lines: string[] = [];
  lines.push(`# ${board.name}`);
  lines.push("");

  const childrenOf = (id: string | null) =>
    board.nodes.filter((n) => n.parentId === id);

  const roots = board.nodes.filter((n) => n.parentId === null);

  const walk = (node: JokeNode, depth: number) => {
    const indent = "  ".repeat(depth);
    const tag = KIND_LABEL[node.kind] ?? node.kind;
    const text = stripDashes(node.body || node.title || "");
    const confirmed = node.confirmed ? " [confirmed]" : "";
    lines.push(`${indent}- ${tag}: ${text}${confirmed}`);
    if (node.kind === "analogy") {
      lines.push(
        `${indent}  - ${node.subject || "subject"} is like ${node.element || "element"}.`,
      );
      lines.push(
        `${indent}  - solve for true: subject ${node.trueForSubject ? "yes" : "no"}, element ${node.trueForElement ? "yes" : "no"}`,
      );
    }
    if (node.kind === "cliche" && node.clicheList?.length) {
      for (const c of node.clicheList) {
        lines.push(`${indent}  - cliche: ${stripDashes(c)}`);
      }
    }
    for (const child of childrenOf(node.id)) {
      walk(child, depth + 1);
    }
  };

  for (const root of roots) walk(root, 0);

  return lines.join("\n") + "\n";
}

// The set export: each beat on its own line, setup then tag.
export function setToMarkdown(board: Board): string {
  const beats = board.nodes
    .filter((n) => n.inSet)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const lines: string[] = [];
  lines.push(`# ${board.name}: the set`);
  lines.push("");
  beats.forEach((beat, i) => {
    lines.push(`${i + 1}. ${stripDashes(beat.body || beat.title)}`);
  });
  lines.push("");
  return lines.join("\n") + "\n";
}

export function setToPlainText(board: Board): string {
  const beats = board.nodes
    .filter((n) => n.inSet)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    beats.map((b) => stripDashes(b.body || b.title)).join("\n\n") + "\n"
  );
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
