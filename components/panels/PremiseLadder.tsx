"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { JokeNode, QuestionType } from "@/lib/types";
import { recommendTechniques, specializeQuestion } from "@/lib/specialize";
import { ActionButton, MonoTextarea, TextInput } from "../ui";

// A guided ladder that shapes a premise into a punch, one move at a time:
// lock the attitude, name and break the assumption, pick a fitting engine,
// then draft and tag the punch. Each step writes real bubbles to the board,
// so the graph model is unchanged. This is a directive front door, not a new
// engine.

const STEPS = ["Attitude", "Assumption", "Engine", "Punch"];

export function PremiseLadder({ node }: { node: JokeNode }) {
  const premise = node.body;
  const nodes = useStore((s) => s.nodes);
  const addIdeaChild = useStore((s) => s.addIdeaChild);
  const addAnalogyTo = useStore((s) => s.addAnalogyTo);
  const addJokeChild = useStore((s) => s.addJokeChild);
  const addTag = useStore((s) => s.addTag);
  const selectNode = useStore((s) => s.selectNode);

  const [step, setStep] = useState(0);
  const [attitude, setAttitude] = useState("");
  const [assumption, setAssumption] = useState("");
  const [breakIt, setBreakIt] = useState("");
  const [punch, setPunch] = useState("");
  const [tag, setTag] = useState("");
  const [lockedJokeId, setLockedJokeId] = useState<string | null>(null);

  const attitudePrompt = useMemo(
    () => specializeQuestion("emotional_xray", premise).specific,
    [premise],
  );
  const assumptionPrompt = useMemo(
    () => specializeQuestion("shatter_assumption", premise).specific,
    [premise],
  );
  const recs = useMemo(() => recommendTechniques(premise), [premise]);

  if (!premise.trim()) return null;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function commitAttitude() {
    if (attitude.trim()) {
      addIdeaChild(node.id, attitude.trim());
      setAttitude("");
    }
    next();
  }

  function commitAssumption() {
    const a = assumption.trim();
    const b = breakIt.trim();
    if (a || b) {
      const text = a && b ? `They assume ${a}. But ${b}.` : a || b;
      addIdeaChild(node.id, text);
      setAssumption("");
      setBreakIt("");
    }
    next();
  }

  function applyRec(rec: (typeof recs)[number]) {
    if (rec.action === "analogy") {
      addAnalogyTo(node.id);
      return; // selecting the new analogy node hands off to its panel
    }
    const q = nodes.find(
      (n) =>
        n.parentId === node.id &&
        n.kind === "question" &&
        n.questionType === (rec.questionType as QuestionType),
    );
    if (q) selectNode(q.id);
  }

  function lockPunch() {
    if (!punch.trim()) return;
    const id = addJokeChild(node.id, punch.trim());
    setLockedJokeId(id || null);
    setPunch("");
  }

  function commitTag() {
    if (lockedJokeId && tag.trim()) {
      addTag(lockedJokeId, tag.trim(), "tag");
      setTag("");
    }
  }

  return (
    <div className="border border-ink-600 rounded-xl overflow-hidden">
      <div className="bg-ink-900 px-3 py-2.5 border-b border-ink-600">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-bone leading-none">
            Shape this premise
          </h3>
          <span className="text-[10px] font-mono text-bone-muted">
            STEP {step + 1} / {STEPS.length}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className="flex-1"
              title={label}
            >
              <span
                className={`block h-1 rounded-full ${
                  i <= step ? "bg-hazard" : "bg-ink-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {step === 0 && (
          <>
            <p className="text-sm text-bone/85 font-medium">
              Lock the attitude.
            </p>
            <p className="text-xs text-bone/55">
              {attitudePrompt ??
                "What do you irrationally feel about this. Say it like a reasonable universal law."}
            </p>
            <MonoTextarea
              value={attitude}
              onChange={setAttitude}
              rows={2}
              placeholder="It should be illegal to..."
            />
            <StepNav onBack={null} onNext={commitAttitude} nextLabel="Add and continue" />
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-bone/85 font-medium">
              Name the assumption, then break it.
            </p>
            <p className="text-xs text-bone/55">
              {assumptionPrompt ??
                "What does the audience assume here. Then reveal the version that breaks it."}
            </p>
            <div>
              <label className="text-[10px] font-mono tracking-widest text-hazard">
                THEY ASSUME
              </label>
              <TextInput
                value={assumption}
                onChange={setAssumption}
                placeholder="The normal, boring reading."
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest text-hazard">
                BUT ACTUALLY
              </label>
              <TextInput
                value={breakIt}
                onChange={setBreakIt}
                placeholder="The snap that breaks it."
              />
            </div>
            <StepNav onBack={back} onNext={commitAssumption} nextLabel="Add and continue" />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-bone/85 font-medium">
              Pick the engine that fits.
            </p>
            <p className="text-xs text-bone/55">
              These match your premise. Open one to work it, or skip ahead and
              draft the punch.
            </p>
            <ul className="space-y-2">
              {recs.map((rec) => (
                <li key={rec.label}>
                  <button
                    onClick={() => applyRec(rec)}
                    className="w-full text-left bg-ink-900 border border-ink-600 rounded-lg p-2.5 hover:border-hazard transition-colors"
                  >
                    <span className="text-sm text-bone">{rec.label}</span>
                    <span className="block text-xs text-bone/50 mt-0.5">
                      {rec.reason}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <StepNav onBack={back} onNext={next} nextLabel="Draft the punch" />
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-bone/85 font-medium">
              Draft the punch, then tag it.
            </p>
            {!lockedJokeId ? (
              <>
                <MonoTextarea
                  value={punch}
                  onChange={setPunch}
                  rows={3}
                  placeholder="Write the line."
                />
                <div className="flex gap-2">
                  <ActionButton
                    onClick={lockPunch}
                    variant="accent"
                    disabled={!punch.trim()}
                  >
                    Lock as joke
                  </ActionButton>
                  <ActionButton onClick={back}>Back</ActionButton>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-bone/55">
                  Locked. Now a tag, a second punch on the same setup, for more
                  laughs per minute.
                </p>
                <div className="flex gap-2">
                  <TextInput
                    value={tag}
                    onChange={setTag}
                    onEnter={commitTag}
                    placeholder="Another angle on the same setup."
                  />
                  <ActionButton onClick={commitTag} variant="accent">
                    Add tag
                  </ActionButton>
                </div>
                <ActionButton
                  onClick={() => {
                    setLockedJokeId(null);
                    setStep(0);
                  }}
                >
                  Shape another
                </ActionButton>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <ActionButton onClick={onNext} variant="accent">
        {nextLabel}
      </ActionButton>
      {onBack && <ActionButton onClick={onBack}>Back</ActionButton>}
    </div>
  );
}
