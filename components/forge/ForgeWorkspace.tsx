"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { JokeNode } from "@/lib/types";
import { forgePromptSequence } from "@/lib/specialize";
import { aiEnabled, suggestAngles } from "@/lib/ai";
import { downloadText, jokesToMarkdown } from "@/lib/export";
import { MonoTextarea } from "../ui";

// The joke-first workspace. One prompt at a time on the left, a running list
// of captured jokes on the right. Everything you capture is a confirmed joke
// node on the board, so the Map view and the performance set see it too.
// This is the front door: get jokes down, above all else.

function subtreeJokes(nodes: JokeNode[], rootId: string): JokeNode[] {
  const childrenByParent = new Map<string | null, JokeNode[]>();
  for (const n of nodes) {
    const arr = childrenByParent.get(n.parentId) ?? [];
    arr.push(n);
    childrenByParent.set(n.parentId, arr);
  }
  const out: JokeNode[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop() as string;
    for (const child of childrenByParent.get(id) ?? []) {
      if (child.kind === "joke") out.push(child);
      stack.push(child.id);
    }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export function ForgeWorkspace() {
  const nodes = useStore((s) => s.nodes);
  const boardId = useStore((s) => s.boardId);
  const settings = useStore((s) => s.settings);
  const setPremiseText = useStore((s) => s.setPremiseText);
  const addPremise = useStore((s) => s.addPremise);
  const addJokeChild = useStore((s) => s.addJokeChild);

  const premises = useMemo(
    () => nodes.filter((n) => n.kind === "premise"),
    [nodes],
  );

  const [forgeId, setForgeId] = useState<string | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [sparkItems, setSparkItems] = useState<string[]>([]);
  const [sparking, setSparking] = useState(false);
  const [sparkErr, setSparkErr] = useState<string | null>(null);

  // Default the focus to the first premise, and recover if it goes away.
  useEffect(() => {
    if (!premises.find((p) => p.id === forgeId)) {
      setForgeId(premises[0]?.id ?? null);
      setPromptIndex(0);
      setDraft("");
    }
  }, [premises, forgeId, boardId]);

  const active = premises.find((p) => p.id === forgeId) ?? premises[0] ?? null;

  const prompts = useMemo(
    () => (active ? forgePromptSequence(active.body) : []),
    [active],
  );
  const current = prompts.length
    ? prompts[((promptIndex % prompts.length) + prompts.length) % prompts.length]
    : null;

  const jokes = useMemo(
    () => (active ? subtreeJokes(nodes, active.id) : []),
    [nodes, active],
  );

  function resetSpark() {
    setSparkItems([]);
    setSparkErr(null);
  }

  function capture() {
    if (!active || !draft.trim()) return;
    addJokeChild(active.id, draft.trim());
    setDraft("");
  }

  function nextPrompt(dir: 1 | -1) {
    setPromptIndex((i) => i + dir);
    resetSpark();
  }

  // Rapid fire: capture the line and immediately move to the next prompt.
  function captureAndNext() {
    if (!active || !draft.trim()) return;
    addJokeChild(active.id, draft.trim());
    setDraft("");
    nextPrompt(1);
  }

  function exportJokes() {
    if (!active || jokes.length === 0) return;
    const ordered = [...jokes].sort((a, b) => a.createdAt - b.createdAt);
    const slug =
      (active.body.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "jokes").slice(
        0,
        40,
      );
    downloadText(`${slug}-jokes.md`, jokesToMarkdown(active.body, ordered));
  }

  async function spark() {
    if (!active) return;
    setSparking(true);
    setSparkErr(null);
    try {
      const out = await suggestAngles(settings, {
        premise: active.body,
        questionType: current?.questionType,
      });
      setSparkItems(out);
    } catch (e) {
      setSparkErr(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setSparking(false);
    }
  }

  function newPremise() {
    const id = addPremise("");
    setForgeId(id);
    setPromptIndex(0);
    setDraft("");
    resetSpark();
  }

  if (!active) {
    return (
      <div className="flex-1 flex items-center justify-center text-bone/50 font-mono">
        Loading the forge...
      </div>
    );
  }

  const hasPremise = active.body.trim().length > 0;

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left: premise + one prompt at a time. */}
      <div className="flex-1 min-w-0 overflow-y-auto panel-scroll">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-hazard">
                PREMISE
              </span>
              {premises.length > 1 && (
                <select
                  value={active.id}
                  onChange={(e) => {
                    setForgeId(e.target.value);
                    setPromptIndex(0);
                    setDraft("");
                    resetSpark();
                  }}
                  className="bg-ink-800 border border-ink-600 rounded px-2 py-1 text-xs text-bone/80 focus:border-hazard focus:outline-none max-w-[260px]"
                >
                  {premises.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.body.trim() ? p.body.slice(0, 50) : "Untitled premise"}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex-1" />
              <button
                onClick={newPremise}
                className="text-xs font-mono px-2.5 py-1 rounded border border-ink-600 text-bone/70 hover:bg-ink-700 hover:border-ink-500"
              >
                + New premise
              </button>
            </div>
            <MonoTextarea
              value={active.body}
              onChange={(v) => setPremiseText(active.id, v)}
              placeholder="The thing the joke is about. One line."
              rows={2}
            />
          </div>

          {!hasPremise ? (
            <p className="text-sm text-bone/50">
              Type a premise above and the prompts start. Then just write jokes.
            </p>
          ) : (
            current && (
              <div className="rounded-2xl border border-ink-600 bg-ink-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-600 bg-ink-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-hazard">
                      PROMPT {(promptIndex % prompts.length + prompts.length) % prompts.length + 1} / {prompts.length}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-mono text-bone/50">
                      <button onClick={() => nextPrompt(-1)} className="hover:text-bone">
                        prev
                      </button>
                      <button onClick={() => nextPrompt(1)} className="hover:text-bone">
                        next
                      </button>
                    </div>
                  </div>
                  <h2 className="mt-1 font-display text-xl text-bone leading-tight">
                    {current.title}
                  </h2>
                  <p className="mt-1 text-sm text-bone/70">{current.text}</p>
                </div>

                <div className="p-5 space-y-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (e.shiftKey) captureAndNext();
                        else capture();
                      }
                    }}
                    rows={4}
                    placeholder="Write the joke. Bad ones count. Cmd or Ctrl Enter captures, add Shift to also jump to the next prompt."
                    className="w-full bg-ink-900 border border-ink-600 rounded-lg p-3 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none resize-y font-mono text-base"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={capture}
                      disabled={!draft.trim()}
                      className="text-sm font-mono font-semibold px-4 py-2 rounded bg-hazard text-ink-900 hover:bg-hazard/85 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Capture joke
                    </button>
                    <button
                      onClick={captureAndNext}
                      disabled={!draft.trim()}
                      className="text-sm font-mono px-4 py-2 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Rapid fire: capture and jump to the next prompt"
                    >
                      Capture + next
                    </button>
                    <button
                      onClick={() => nextPrompt(1)}
                      className="text-sm font-mono px-4 py-2 rounded border border-ink-600 text-bone/70 hover:bg-ink-700"
                    >
                      Skip
                    </button>
                    {aiEnabled(settings) && (
                      <button
                        onClick={spark}
                        disabled={sparking}
                        className="ml-auto text-xs font-mono px-3 py-2 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink-900 disabled:opacity-50"
                      >
                        {sparking ? "Thinking..." : "Spark with AI"}
                      </button>
                    )}
                  </div>
                  {sparkErr && (
                    <p className="text-xs text-red-400 font-mono break-words">
                      {sparkErr}
                    </p>
                  )}
                  {sparkItems.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono tracking-widest text-bone-muted">
                        TAP TO LOAD INTO THE BOX
                      </p>
                      {sparkItems.map((s) => (
                        <button
                          key={s}
                          onClick={() => setDraft(s)}
                          className="block w-full text-left text-sm bg-ink-900 border border-ink-600 rounded p-2 text-bone/80 hover:border-hazard"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right: the output. Every captured joke, the whole point. */}
      <aside className="w-[380px] shrink-0 border-l border-ink-600 bg-ink-800 flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-ink-600 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg text-bone">Jokes</h2>
            <span className="font-mono text-hazard text-sm">{jokes.length}</span>
          </div>
          <button
            onClick={exportJokes}
            disabled={jokes.length === 0}
            className="text-xs font-mono px-2.5 py-1 rounded border border-ink-600 text-bone/70 hover:bg-ink-700 hover:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download these jokes as Markdown"
          >
            export
          </button>
        </div>
        <div className="flex-1 overflow-y-auto panel-scroll p-3 space-y-2">
          {jokes.length === 0 ? (
            <p className="text-sm text-bone/40 px-1">
              Nothing captured yet. Write a line and hit Capture. Keep them all,
              even the bad ones. Cut later.
            </p>
          ) : (
            jokes.map((j) => <JokeRow key={j.id} node={j} />)
          )}
        </div>
      </aside>
    </div>
  );
}

function JokeRow({ node }: { node: JokeNode }) {
  const updateNode = useStore((s) => s.updateNode);
  const removeNode = useStore((s) => s.removeNode);
  const toggleInSet = useStore((s) => s.toggleInSet);
  const addTag = useStore((s) => s.addTag);
  const [tagging, setTagging] = useState(false);
  const [tagText, setTagText] = useState("");

  function commitTag() {
    if (tagText.trim()) addTag(node.id, tagText.trim(), "tag");
    setTagText("");
    setTagging(false);
  }

  return (
    <div className="bg-ink-900 border border-ink-600 rounded-lg p-2.5">
      {node.tagType && (
        <span className="text-[9px] font-mono tracking-widest text-hazard">
          {node.tagType.toUpperCase()}
        </span>
      )}
      <MonoTextarea
        value={node.body}
        onChange={(v) => updateNode(node.id, { body: v })}
        rows={2}
      />
      <div className="mt-2 flex items-center gap-3 text-[11px] font-mono">
        <button
          onClick={() => toggleInSet(node.id)}
          className={node.inSet ? "text-hazard" : "text-bone/50 hover:text-bone"}
          title="Add to the performance set"
        >
          {node.inSet ? "in set" : "+ set"}
        </button>
        <button
          onClick={() => setTagging((v) => !v)}
          className="text-bone/50 hover:text-bone"
          title="Add a tag, a second punch on this setup"
        >
          + tag
        </button>
        <div className="flex-1" />
        <button
          onClick={() => removeNode(node.id)}
          className="text-bone/40 hover:text-red-400"
        >
          delete
        </button>
      </div>
      {tagging && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTag();
            }}
            placeholder="Second punch on the same setup."
            className="flex-1 bg-ink-800 border border-ink-600 rounded px-2 py-1 text-xs text-bone focus:border-hazard focus:outline-none font-mono"
          />
          <button
            onClick={commitTag}
            className="text-[10px] font-mono px-2 py-1 rounded bg-hazard text-ink-900"
          >
            add
          </button>
        </div>
      )}
    </div>
  );
}
