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
    const marks: string[] = [];
    if (beat.tagType) marks.push(beat.tagType);
    if (beat.physical) marks.push("act out");
    if (beat.callback) marks.push("callback");
    const suffix = marks.length ? ` (${marks.join(", ")})` : "";
    lines.push(`${i + 1}. ${stripDashes(beat.body || beat.title)}${suffix}`);
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

function esc(text: string): string {
  return stripDashes(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// HTML versions for the Google Docs import. Drive converts text/html into a
// native Doc, so headings and lists carry over as real formatting.
export function setToHtml(board: Board): string {
  const beats = board.nodes
    .filter((n) => n.inSet)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const items = beats
    .map((beat) => {
      const marks: string[] = [];
      if (beat.tagType) marks.push(beat.tagType);
      if (beat.physical) marks.push("act out");
      if (beat.callback) marks.push("callback");
      const suffix = marks.length
        ? ` <span style="color:#888">(${marks.join(", ")})</span>`
        : "";
      return `<li>${esc(beat.body || beat.title)}${suffix}</li>`;
    })
    .join("");

  return `<html><body><h1>${esc(board.name)}: the set</h1><ol>${
    items || "<li>(empty set)</li>"
  }</ol></body></html>`;
}

export function boardToHtml(board: Board): string {
  const childrenOf = (id: string | null) =>
    board.nodes.filter((n) => n.parentId === id);
  const roots = board.nodes.filter((n) => n.parentId === null);

  const walk = (node: JokeNode): string => {
    const tag = KIND_LABEL[node.kind] ?? node.kind;
    const confirmed = node.confirmed ? " [confirmed]" : "";
    const kids = childrenOf(node.id);
    const sub = kids.length
      ? `<ul>${kids.map(walk).join("")}</ul>`
      : "";
    return `<li><strong>${esc(tag)}:</strong> ${esc(
      node.body || node.title,
    )}${confirmed}${sub}</li>`;
  };

  return `<html><body><h1>${esc(board.name)}</h1><ul>${roots
    .map(walk)
    .join("")}</ul></body></html>`;
}

// Just the captured jokes for one premise, in writing order, as a flat list.
// This is the Forge level export: the output, nothing else.
export function jokesToMarkdown(title: string, jokes: JokeNode[]): string {
  const lines: string[] = [`# Jokes: ${stripDashes(title || "Untitled premise")}`, ""];
  jokes.forEach((j, i) => {
    const mark = j.tagType ? ` (${j.tagType})` : "";
    lines.push(`${i + 1}. ${stripDashes(j.body || j.title)}${mark}`);
  });
  return lines.join("\n") + "\n";
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
