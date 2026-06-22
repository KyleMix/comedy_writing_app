import {
  keywords,
  pivotWord,
  subjectGuess,
  subjectIsPerson,
} from "./textAnalysis";

// The craft engine. Given a setup line, it offers concrete punch moves, each
// a named technique with a how to and a scaffold seeded from the comedian's
// own words. The point is to drive a punchline, not to file the setup as a
// joke. Offline and deterministic. The AI layer writes candidate punches on
// top of these when a key is set.

export interface PunchMove {
  key: string;
  label: string;
  how: string; // the craft instruction
  scaffold: string; // seeded hint for what the punch should do
  technique: string; // description handed to the AI
}

function truncate(text: string, max = 60): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
}

export function punchMoves(setup: string): PunchMove[] {
  const text = setup.trim();
  const subject = subjectGuess(text) || "this";
  const topic = keywords(text, 1)[0] || subject;
  const p = pivotWord(text);
  const person = subjectIsPerson(text);
  const t = truncate(text);

  return [
    {
      key: "misdirection",
      label: "Misdirection",
      how: "Lead them to the obvious read, then land on the last thing they expect.",
      scaffold: `They assume the normal version of "${t}". Your punch goes the opposite way.`,
      technique:
        "misdirection: set up the obvious expectation from the setup, then subvert it with the punchline",
    },
    {
      key: "act_out",
      label: "Act it out",
      how: "Stop narrating. Become the person and let them talk.",
      scaffold: `Voice ${person ? `"${subject}"` : "someone in the scene"}. The punch is the dumb thing they actually say or do.`,
      technique:
        "act out: write the punchline as a line of in character dialogue or a physical reaction, not narration",
    },
    {
      key: "analogy",
      label: "Forced analogy",
      how: "Claim two unlike things are the same, then make it true for both.",
      scaffold: `"${subject}" is like ____. The punch names the trait that is true for both sides.`,
      technique:
        "forced analogy: compare the subject to something unlike it, the punchline must ring true for both the subject and the thing it is compared to",
    },
    {
      key: "heighten",
      label: "Heighten",
      how: "Push it one step past sane, then one more.",
      scaffold: `Take "${topic}" and make the punch the absurd extreme of it.`,
      technique:
        "heighten: exaggerate the premise to an absurd extreme in the punchline",
    },
    {
      key: "wordplay",
      label: "Wordplay",
      how: "Swing on a word that means two things.",
      scaffold: p?.meanings
        ? `Swing on "${p.word}": ${p.meanings}. Land on the meaning they did not expect.`
        : p
          ? `Find a second meaning, slang, or a homophone for "${p.word}" and land on it.`
          : `Find a word in the setup with a second meaning and land on it.`,
      technique:
        "wordplay or double entendre: build the punchline on a word that carries a second meaning",
    },
  ];
}

export function getMove(setup: string, key: string): PunchMove {
  const moves = punchMoves(setup);
  return moves.find((m) => m.key === key) ?? moves[0];
}

// Join a setup and a punch into one performable line. The punch is the
// payload, the setup is optional context before it.
export function buildJoke(setup: string, punch: string): string {
  const s = setup.trim();
  const p = punch.trim();
  if (!p) return s;
  if (!s) return p;
  const sep = /[.!?]["')\]]?$/.test(s) ? " " : ". ";
  return `${s}${sep}${p}`;
}
