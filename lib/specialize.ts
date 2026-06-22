import type { QuestionType } from "./types";
import { getQuestionSpec } from "./methodology";
import {
  convergingPair,
  keywords,
  pivotWord,
  subjectGuess,
  subjectIsPerson,
} from "./textAnalysis";

// Turn a generic guiding question into one that names the words the comedian
// actually entered. Offline and deterministic. When the premise is empty we
// fall back to the canonical methodology copy untouched.

export interface SpecificQuestion {
  base: string; // the canonical methodology question
  specific: string | null; // tailored to the entered text, or null if no text
}

export function specializeQuestion(
  type: QuestionType,
  premise: string,
): SpecificQuestion {
  const spec = getQuestionSpec(type);
  const text = premise.trim();
  if (!text) return { base: spec.question, specific: null };

  const specific = build(type, text);
  return { base: spec.question, specific };
}

function build(type: QuestionType, text: string): string | null {
  const subject = subjectGuess(text);
  switch (type) {
    case "double_entendre": {
      const p = pivotWord(text);
      if (!p) return null;
      if (p.meanings) {
        return `The word "${p.word}" in your premise carries more than one meaning: ${p.meanings}. Swing to the meaning the audience did not expect.`;
      }
      return `Look hard at "${p.word}". Does it have a second meaning, a slang use, or a homophone you can swing to. If not, try the next noun.`;
    }
    case "converging": {
      const pair = convergingPair(text);
      if (!pair) return null;
      return `You have "${pair[0]}" and "${pair[1]}" sitting in the same premise. Smash them together. What absurd thing is true if those two ideas belong to each other.`;
    }
    case "shatter_assumption": {
      if (!subject) return null;
      return `The audience assumes the normal, boring version of "${subject}". Name the thing everyone takes for granted here, then reveal the version that breaks it.`;
    }
    case "literal": {
      const k = keywords(text, 1)[0] ?? subject;
      return `Take "${k}" literally. Build the dumb physical world where the figure of speech is actually true, and live in it for a beat.`;
    }
    case "escalate": {
      return `Start from "${truncate(text)}". Now top it three times. Each beat worse than the last.`;
    }
    case "worst_person": {
      return `Who is the worst, least qualified person to be stuck dealing with "${truncate(text)}". Drop them in.`;
    }
    case "hidden_shame": {
      return `What does "${truncate(text)}" quietly admit about you. Aim the joke back at yourself.`;
    }
    case "reverse_power": {
      return `In "${truncate(text)}", who has the power. Flip it completely and describe the new arrangement.`;
    }
    case "wrong_frame": {
      return `Narrate "${truncate(text)}" in the wrong vocabulary: nature documentary, tech support, war, sports, scripture.`;
    }
    case "alien_dog": {
      return `How would a dog, a toddler, or an alien read "${truncate(text)}" with zero human context. Strip it to the absurd mechanics.`;
    }
    case "emotional_xray": {
      return `What do you irrationally feel about "${truncate(text)}". State that feeling like it is a reasonable universal law.`;
    }
    case "assumption_stack": {
      return `List three things the audience assumes are normal about "${truncate(text)}". Then snap the one nobody would think to question.`;
    }
    case "own_fault": {
      return `Rewrite "${truncate(text)}" so you are obviously the actual problem.`;
    }
    default:
      return null;
  }
}

function truncate(text: string, max = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max).trim() + "..." : clean;
}

// Offline scenario suggestions: adjacent situations and moves that push the
// joke along. Each references the comedian's own words so it does not read
// like a generic checklist. These render as chips the comedian can keep as
// idea bubbles or promote into their own premise.
export function suggestScenarios(premise: string): string[] {
  const text = premise.trim();
  if (!text) return [];
  const subject = subjectGuess(text) || "this";
  const k = keywords(text, 3);
  const topic = k[0] ?? subject;
  const person = subjectIsPerson(text);

  const out: string[] = [];

  out.push(
    `Raise the stakes: put "${topic}" somewhere it could go very wrong, a funeral, a job interview, a courtroom.`,
  );
  out.push(
    person
      ? `Swap who it happens to: the most innocent person you know hits this exact problem.`
      : `Swap the person: who is the worst person to be stuck with "${topic}", a cop, a priest, a surgeon, a toddler.`,
  );
  out.push(
    `Change the setting: run the same beat at the DMV, an airport, a church, a hospital.`,
  );
  out.push(`Shrink it: the pettiest, most embarrassing version of "${topic}".`);
  out.push(
    `Blow it up: the world where everyone has "${topic}" and it is a national crisis.`,
  );
  if (k[1]) {
    out.push(
      `Chase the detail: what else in life works like "${k[1]}". Find the surprising match.`,
    );
  }
  out.push(`Move the clock: this same thing fifty years ago, or fifty from now.`);

  return out.slice(0, 6);
}
