"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { JokeNode } from "@/lib/types";
import { buildJoke, getMove, punchMoves } from "@/lib/craft";
import { aiEnabled, suggestPunchlines } from "@/lib/ai";
import { downloadText, jokesToMarkdown } from "@/lib/export";
import { MonoTextarea } from "../ui";

// The joke-first workspace. You craft on the left, setup then punch move then
// punch, and the running list of captured jokes lives on the right. The app
// does real comedic work on the line: it names the move and scaffolds the
// punch from your own words, and writes candidate punches when a key is set.

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
  const [setup, setSetup] = useState("");
  const [moveKey, setMoveKey] = useState("misdirection");
  const [punch, setPunch] = useState("");
  const [aiItems, setAiItems] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  const active = premises.find((p) => p.id === forgeId) ?? premises[0] ?? null;

  // Focus the first premise, recover if it goes away, and seed the setup from
  // the premise when the focus changes.
  useEffect(() => {
    if (!premises.find((p) => p.id === forgeId)) {
      const fallback = premises[0]?.id ?? null;
      setForgeId(fallback);
    }
  }, [premises, forgeId, boardId]);

  useEffect(() => {
    setSetup(active?.body ?? "");
    setPunch("");
    setAiItems([]);
    setAiErr(null);
  }, [forgeId, active?.body]);

  const moves = useMemo(() => punchMoves(setup), [setup]);
  const move = useMemo(() => getMove(setup, moveKey), [setup, moveKey]);

  const jokes = useMemo(
    () => (active ? subtreeJokes(nodes, active.id) : []),
    [nodes, active],
  );

  function capture() {
    if (!active || !punch.trim()) return;
    addJokeChild(active.id, buildJoke(setup, punch));
    setPunch("");
    setAiItems([]);
  }

  function nextMove() {
    const i = moves.findIndex((m) => m.key === moveKey);
    setMoveKey(moves[(i + 1) % moves.length].key);
    setAiItems([]);
    setAiErr(null);
  }

  // Rapid fire: capture, keep the setup, and rotate to the next punch move so
  // you attack the same setup from a fresh angle.
  function captureAndNext() {
    if (!active || !punch.trim()) return;
    addJokeChild(active.id, buildJoke(setup, punch));
    setPunch("");
    nextMove();
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

  async function writePunches() {
    if (!active || !setup.trim()) return;
    setAiBusy(true);
    setAiErr(null);
    try {
      const out = await suggestPunchlines(settings, {
        premise: active.body,
        setup: setup.trim(),
        technique: move.technique,
      });
      setAiItems(out);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setAiBusy(false);
    }
  }

  function newPremise() {
    const id = addPremise("");
    setForgeId(id);
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
      {/* Left: premise, then the craft card. */}
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
                  onChange={(e) => setForgeId(e.target.value)}
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
              Type a premise above. Then the forge helps you build the setup
              into an actual punchline.
            </p>
          ) : (
            <div className="rounded-2xl border border-ink-600 bg-ink-800 overflow-hidden">
              {/* Setup */}
              <div className="px-5 py-4 border-b border-ink-600 bg-ink-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-hazard">
                    SETUP, WHAT YOU SAY BEFORE THE LAUGH
                  </span>
                  <button
                    onClick={() => setSetup(active.body)}
                    className="text-[10px] font-mono text-bone-muted hover:text-bone"
                    title="Reset the setup to the premise"
                  >
                    from premise
                  </button>
                </div>
                <MonoTextarea
                  value={setup}
                  onChange={setSetup}
                  rows={2}
                  placeholder="The specific line that sets up the laugh."
                />
              </div>

              <div className="p-5 space-y-4">
                {/* Punch move picker */}
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-bone-muted mb-2">
                    PICK A PUNCH MOVE
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moves.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => {
                          setMoveKey(m.key);
                          setAiItems([]);
                          setAiErr(null);
                        }}
                        className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
                          m.key === moveKey
                            ? "border-hazard text-hazard bg-hazard/10"
                            : "border-ink-600 text-bone/60 hover:text-bone hover:border-ink-500"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* The move's craft instruction, scaffolded from the words */}
                <div className="bg-ink-900 border-l-2 border-hazard rounded-r-lg px-3 py-2.5">
                  <p className="text-sm text-bone/90">{move.how}</p>
                  <p className="text-xs text-bone/55 mt-1">{move.scaffold}</p>
                </div>

                {/* Punch */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-hazard">
                    PUNCH, THE LINE THAT LANDS
                  </span>
                  <textarea
                    value={punch}
                    onChange={(e) => setPunch(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (e.shiftKey) captureAndNext();
                        else capture();
                      }
                    }}
                    rows={3}
                    placeholder="Write the punch. Cmd or Ctrl Enter captures, add Shift to rotate the move."
                    className="w-full bg-ink-900 border border-ink-600 rounded-lg p-3 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none resize-y font-mono text-base"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={capture}
                      disabled={!punch.trim()}
                      className="text-sm font-mono font-semibold px-4 py-2 rounded bg-hazard text-ink-900 hover:bg-hazard/85 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Capture joke
                    </button>
                    <button
                      onClick={captureAndNext}
                      disabled={!punch.trim()}
                      className="text-sm font-mono px-4 py-2 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Capture, keep the setup, rotate to the next punch move"
                    >
                      Capture + next move
                    </button>
                    {aiEnabled(settings) && (
                      <button
                        onClick={writePunches}
                        disabled={aiBusy || !setup.trim()}
                        className="ml-auto text-xs font-mono px-3 py-2 rounded border border-hazard text-hazard hover:bg-hazard hover:text-ink-900 disabled:opacity-50"
                        title="Write candidate punchlines for this setup with this move"
                      >
                        {aiBusy ? "Writing..." : "Write me 5 punches"}
                      </button>
                    )}
                  </div>
                  {aiErr && (
                    <p className="text-xs text-red-400 font-mono break-words">
                      {aiErr}
                    </p>
                  )}
                  {aiItems.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono tracking-widest text-bone-muted">
                        TAP TO LOAD INTO THE PUNCH BOX, THEN SHARPEN IT
                      </p>
                      {aiItems.map((s) => (
                        <button
                          key={s}
                          onClick={() => setPunch(s)}
                          className="block w-full text-left text-sm bg-ink-900 border border-ink-600 rounded p-2 text-bone/80 hover:border-hazard"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!aiEnabled(settings) && (
                  <p className="text-[11px] text-bone/40">
                    Add an Anthropic key in Settings to have the forge write
                    candidate punches for you. It works without one.
                  </p>
                )}
              </div>
            </div>
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
              Nothing captured yet. Pick a move, write a punch, hit Capture.
              Keep them all, even the bad ones. Cut later.
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
