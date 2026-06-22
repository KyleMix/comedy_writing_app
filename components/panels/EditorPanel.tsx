"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { JokeNode } from "@/lib/types";
import {
  ANALOGY_ANTAGONISTIC_NUDGE,
  ANALOGY_DIRECTIONS,
  ANALOGY_GOLDEN_RULE,
  ANALOGY_WORKED_EXAMPLE,
  CLICHE_HELP,
  getQuestionSpec,
  JOURNALISM_LABELS,
  LISTING_CATEGORIES,
  LISTING_HINT,
  STORY_ELEMENTS_LABELS,
  STORY_HELP,
} from "@/lib/methodology";
import { ActionButton, Checkbox, MonoTextarea, TextInput } from "../ui";
import { AiSuggest } from "./AiSuggest";

function findPremiseText(nodes: JokeNode[], node: JokeNode): string {
  let current: JokeNode | undefined = node;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.kind === "premise") return current.body;
    current = nodes.find((n) => n.id === current?.parentId);
  }
  return "";
}

export default function EditorPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nodes = useStore((s) => s.nodes);
  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          key={node.id}
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="absolute top-0 right-0 h-full w-[420px] max-w-full bg-ink-800 border-l border-ink-600 z-20 flex flex-col shadow-bubble"
        >
          <PanelBody node={node} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelBody({ node }: { node: JokeNode }) {
  const nodes = useStore((s) => s.nodes);
  const selectNode = useStore((s) => s.selectNode);
  const removeNode = useStore((s) => s.removeNode);
  const premiseText = findPremiseText(nodes, node);
  const isRoot = node.kind === "premise" && node.parentId === null;

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 border-b border-ink-600">
        <span className="font-mono text-xs tracking-widest text-hazard">
          {node.kind.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          {!isRoot && (
            <button
              onClick={() => removeNode(node.id)}
              className="text-xs font-mono text-red-400/80 hover:text-red-400"
              title="Delete this bubble and its children"
            >
              delete
            </button>
          )}
          <button
            onClick={() => selectNode(null)}
            className="text-bone/50 hover:text-bone text-lg leading-none"
            title="Close"
          >
            ×
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto panel-scroll px-5 py-4 space-y-4">
        {node.kind === "premise" && <PremiseEditor node={node} />}
        {node.kind === "question" && (
          <QuestionEditor node={node} premiseText={premiseText} />
        )}
        {node.kind === "listing" && (
          <ListingEditor node={node} premiseText={premiseText} />
        )}
        {node.kind === "analogy" && <AnalogyEditor node={node} />}
        {node.kind === "cliche" && <ClicheEditor node={node} />}
        {node.kind === "story" && <StoryEditor node={node} />}
        {(node.kind === "idea" || node.kind === "joke") && (
          <SimpleEditor node={node} />
        )}
      </div>

      <CommonActions node={node} />
    </>
  );
}

function PremiseEditor({ node }: { node: JokeNode }) {
  const setPremiseText = useStore((s) => s.setPremiseText);
  return (
    <div className="space-y-3">
      <p className="text-sm text-bone/60">
        Type your premise. One line. The thing the joke is about. Fill it and
        the three questions plus the listing bubble pop out around it.
      </p>
      <MonoTextarea
        value={node.body}
        onChange={(v) => setPremiseText(node.id, v)}
        placeholder="My ex is impossible to reach."
        rows={3}
      />
    </div>
  );
}

function QuestionEditor({
  node,
  premiseText,
}: {
  node: JokeNode;
  premiseText: string;
}) {
  const spec = getQuestionSpec(node.questionType ?? "double_entendre");
  const addIdeaChild = useStore((s) => s.addIdeaChild);
  const [draft, setDraft] = useState("");

  function commit() {
    if (!draft.trim()) return;
    addIdeaChild(node.id, draft.trim());
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-bone leading-tight">
          {spec.title}
        </h2>
        <p className="mt-2 text-sm text-bone/70">{spec.question}</p>
      </div>
      <div className="bg-ink-900 border border-ink-600 rounded-lg p-3">
        <p className="text-[10px] font-mono tracking-widest text-hazard mb-1">
          WORKED EXAMPLE
        </p>
        <p className="text-sm font-mono text-bone/80">{spec.example}</p>
      </div>
      <div>
        <p className="text-xs text-bone/50 mb-1">
          Each answer spawns an idea bubble.
        </p>
        <TextInput
          value={draft}
          onChange={setDraft}
          onEnter={commit}
          placeholder="Write an angle, press Enter."
        />
        <div className="mt-2">
          <ActionButton onClick={commit} variant="accent">
            Add idea
          </ActionButton>
        </div>
      </div>
      <AiSuggest
        parentId={node.id}
        premise={premiseText}
        questionType={node.questionType}
      />
    </div>
  );
}

function ListingEditor({
  node,
  premiseText,
}: {
  node: JokeNode;
  premiseText: string;
}) {
  const addIdeaChild = useStore((s) => s.addIdeaChild);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function commit(category: string) {
    const v = (drafts[category] ?? "").trim();
    if (!v) return;
    addIdeaChild(node.id, v, {
      listingCategory: category as JokeNode["listingCategory"],
      title: `${category}: ${v}`.slice(0, 60),
    });
    setDrafts((d) => ({ ...d, [category]: "" }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-bone leading-tight">
          The Listing Method
        </h2>
        <p className="mt-2 text-sm text-bone/70">{LISTING_HINT}</p>
      </div>
      <div className="space-y-3">
        {LISTING_CATEGORIES.map((cat) => (
          <div key={cat}>
            <label className="text-[10px] font-mono tracking-widest text-hazard">
              {cat.toUpperCase()}
            </label>
            <div className="flex gap-2 mt-1">
              <TextInput
                value={drafts[cat] ?? ""}
                onChange={(v) => setDrafts((d) => ({ ...d, [cat]: v }))}
                onEnter={() => commit(cat)}
                placeholder={`A ${cat.toLowerCase().replace(/s$/, "")} tied to the topic.`}
              />
              <ActionButton onClick={() => commit(cat)} variant="accent">
                +
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
      <AiSuggest parentId={node.id} premise={premiseText} listing />
    </div>
  );
}

function AnalogyEditor({ node }: { node: JokeNode }) {
  const updateNode = useStore((s) => s.updateNode);
  const confirmAsJoke = useStore((s) => s.confirmAsJoke);
  const subjectIsPerson = /\b(ex|wife|husband|girlfriend|boyfriend|mom|dad|friend|boss|she|he)\b/i.test(
    node.subject ?? "",
  );
  const canConfirm = Boolean(node.trueForSubject && node.trueForElement);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-bone leading-tight">
          Forced analogy
        </h2>
        <p className="mt-2 text-sm text-bone/70">{ANALOGY_GOLDEN_RULE}</p>
      </div>

      <div className="bg-ink-900 border border-ink-600 rounded-lg p-3">
        <p className="text-[10px] font-mono tracking-widest text-hazard mb-1">
          WORKED EXAMPLE
        </p>
        <p className="text-sm font-mono text-bone/80">
          {ANALOGY_WORKED_EXAMPLE}
        </p>
      </div>

      <div className="flex gap-2">
        {(["element_first", "trait_first"] as const).map((dir) => (
          <button
            key={dir}
            onClick={() => updateNode(node.id, { analogyDirection: dir })}
            className={`flex-1 text-xs font-mono px-2 py-2 rounded border ${
              node.analogyDirection === dir
                ? "border-hazard text-hazard"
                : "border-ink-500 text-bone/60"
            }`}
          >
            {ANALOGY_DIRECTIONS[dir].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-bone/50">
        {ANALOGY_DIRECTIONS[node.analogyDirection ?? "element_first"].help}
      </p>

      <div className="space-y-2">
        <label className="text-[10px] font-mono tracking-widest text-hazard">
          SUBJECT (X)
        </label>
        <TextInput
          value={node.subject ?? ""}
          onChange={(v) => updateNode(node.id, { subject: v })}
          placeholder="My ex"
        />
        {subjectIsPerson ? null : (
          <p className="text-[11px] text-bone/40">{ANALOGY_ANTAGONISTIC_NUDGE}</p>
        )}
        <label className="text-[10px] font-mono tracking-widest text-hazard">
          ELEMENT (Y)
        </label>
        <TextInput
          value={node.element ?? ""}
          onChange={(v) => updateNode(node.id, { element: v })}
          placeholder="A smartphone"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono tracking-widest text-hazard">
          PUNCHLINE
        </label>
        <MonoTextarea
          value={node.body}
          onChange={(v) => updateNode(node.id, { body: v })}
          placeholder="At any given time I can usually find her at at least one bar."
          rows={3}
        />
      </div>

      <div className="bg-ink-900 border border-ink-600 rounded-lg p-3 space-y-2">
        <p className="text-[10px] font-mono tracking-widest text-hazard">
          SOLVE FOR TRUE
        </p>
        <Checkbox
          checked={Boolean(node.trueForSubject)}
          onChange={(v) => updateNode(node.id, { trueForSubject: v })}
          label="True for the subject on its own"
        />
        <Checkbox
          checked={Boolean(node.trueForElement)}
          onChange={(v) => updateNode(node.id, { trueForElement: v })}
          label="True for the element on its own"
        />
        {!canConfirm && (
          <p className="text-[11px] text-bone/40">
            Both boxes must be checked before this can become a joke. The
            golden rule is enforced here.
          </p>
        )}
      </div>

      <ActionButton
        onClick={() => confirmAsJoke(node.id)}
        variant="accent"
        disabled={!canConfirm}
        title={
          canConfirm
            ? "Promote to a confirmed joke"
            : "Check both solve for true boxes first"
        }
      >
        Confirm as joke
      </ActionButton>
    </div>
  );
}

function ClicheEditor({ node }: { node: JokeNode }) {
  const updateNode = useStore((s) => s.updateNode);
  const confirmAsJoke = useStore((s) => s.confirmAsJoke);
  const [draft, setDraft] = useState("");
  const list = node.clicheList ?? [];

  function addCliche() {
    if (!draft.trim()) return;
    updateNode(node.id, { clicheList: [...list, draft.trim()] });
    setDraft("");
  }

  function removeCliche(i: number) {
    updateNode(node.id, {
      clicheList: list.filter((_, idx) => idx !== i),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-bone leading-tight">
          Cliche reformation
        </h2>
        <p className="mt-2 text-sm text-bone/70">{CLICHE_HELP}</p>
      </div>

      <div>
        <label className="text-[10px] font-mono tracking-widest text-hazard">
          RUNNING LIST OF CLICHES
        </label>
        <div className="flex gap-2 mt-1">
          <TextInput
            value={draft}
            onChange={setDraft}
            onEnter={addCliche}
            placeholder="A familiar phrase tied to the topic."
          />
          <ActionButton onClick={addCliche} variant="accent">
            +
          </ActionButton>
        </div>
        <ul className="mt-2 space-y-1">
          {list.map((c, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-ink-700 rounded px-2 py-1 text-sm"
            >
              <span className="text-bone/80">{c}</span>
              <button
                onClick={() => removeCliche(i)}
                className="text-bone/40 hover:text-red-400 text-xs"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="text-[10px] font-mono tracking-widest text-hazard">
          REFORMED TWIST
        </label>
        <MonoTextarea
          value={node.body}
          onChange={(v) => updateNode(node.id, { body: v })}
          placeholder="Twist the phrase into a new comedic meaning."
          rows={3}
        />
      </div>

      <ActionButton
        onClick={() => confirmAsJoke(node.id)}
        variant="accent"
        disabled={!node.body.trim()}
      >
        Confirm as joke
      </ActionButton>
    </div>
  );
}

function StoryEditor({ node }: { node: JokeNode }) {
  const updateNode = useStore((s) => s.updateNode);
  const elements = node.storyElements ?? {
    setting: false,
    theme: false,
    plot: false,
    character: false,
    conflict: false,
  };
  const journalism = node.journalism ?? {
    who: false,
    what: false,
    where: false,
    why: false,
    when: false,
    how: false,
    moral: false,
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-bone leading-tight">
          Write the story straight
        </h2>
        <p className="mt-2 text-sm text-bone/70">{STORY_HELP}</p>
      </div>

      <MonoTextarea
        value={node.body}
        onChange={(v) => updateNode(node.id, { body: v })}
        placeholder="Tell the story with no jokes yet."
        rows={6}
      />

      <div>
        <p className="text-[10px] font-mono tracking-widest text-hazard mb-2">
          FIVE STORY ELEMENTS
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.keys(STORY_ELEMENTS_LABELS) as Array<
              keyof typeof STORY_ELEMENTS_LABELS
            >
          ).map((key) => (
            <Checkbox
              key={key}
              checked={elements[key]}
              onChange={(v) =>
                updateNode(node.id, {
                  storyElements: { ...elements, [key]: v },
                })
              }
              label={STORY_ELEMENTS_LABELS[key]}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-mono tracking-widest text-hazard mb-2">
          JOURNALISM BASICS
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.keys(JOURNALISM_LABELS) as Array<
              keyof typeof JOURNALISM_LABELS
            >
          ).map((key) => (
            <Checkbox
              key={key}
              checked={journalism[key]}
              onChange={(v) =>
                updateNode(node.id, {
                  journalism: { ...journalism, [key]: v },
                })
              }
              label={JOURNALISM_LABELS[key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleEditor({ node }: { node: JokeNode }) {
  const updateNode = useStore((s) => s.updateNode);
  return (
    <div className="space-y-3">
      <p className="text-sm text-bone/60">
        {node.kind === "joke"
          ? "A confirmed beat. Edit the line, include it in the set, or branch it into its own premise."
          : "An idea bubble. Refine it, branch it, or confirm it into a joke."}
      </p>
      <MonoTextarea
        value={node.body}
        onChange={(v) => updateNode(node.id, { body: v })}
        rows={4}
      />
    </div>
  );
}

function CommonActions({ node }: { node: JokeNode }) {
  const promoteToPremise = useStore((s) => s.promoteToPremise);
  const addAnalogyTo = useStore((s) => s.addAnalogyTo);
  const addClicheTo = useStore((s) => s.addClicheTo);
  const addStoryTo = useStore((s) => s.addStoryTo);
  const confirmAsJoke = useStore((s) => s.confirmAsJoke);
  const toggleInSet = useStore((s) => s.toggleInSet);

  const canPromote = node.kind === "idea" || node.kind === "joke";
  const canConfirmHere = node.kind === "idea";
  const canSet = node.kind === "joke" || node.kind === "idea";

  return (
    <footer className="border-t border-ink-600 px-5 py-3 flex flex-wrap gap-2">
      <ActionButton onClick={() => addAnalogyTo(node.id)}>
        Force an analogy
      </ActionButton>
      <ActionButton onClick={() => addClicheTo(node.id)}>
        Add cliche
      </ActionButton>
      {node.kind === "premise" && (
        <ActionButton onClick={() => addStoryTo(node.id)}>
          Add story
        </ActionButton>
      )}
      {canConfirmHere && (
        <ActionButton onClick={() => confirmAsJoke(node.id)} variant="accent">
          Confirm as joke
        </ActionButton>
      )}
      {canPromote && (
        <ActionButton onClick={() => promoteToPremise(node.id)}>
          Make this a premise
        </ActionButton>
      )}
      {canSet && (
        <ActionButton
          onClick={() => toggleInSet(node.id)}
          variant={node.inSet ? "accent" : "default"}
        >
          {node.inSet ? "In set" : "Add to set"}
        </ActionButton>
      )}
    </footer>
  );
}
