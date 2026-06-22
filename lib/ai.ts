import type { QuestionType, Settings } from "./types";
import { getQuestionSpec, LISTING_HINT } from "./methodology";
import { stripDashes } from "./utils";

// Optional, pluggable AI assist. The full app works offline with zero key.
// This wrapper calls the Anthropic Messages API client side only when a key
// is present. Never block the offline flow on AI.

export function aiEnabled(settings: Settings): boolean {
  return settings.anthropicKey.trim().length > 0;
}

const SYSTEM = [
  "You are a writing room assistant for a stand up comedian.",
  "You follow the Jerry Corley methodology exactly and invent no new theory.",
  "Voice: punk, Adult Swim register, sharp, never corporate, never cutesy.",
  "Hard rule: never use em dashes or en dashes. Use periods, commas, colons only.",
  "Return only a flat list, one candidate per line, no numbering, no preamble.",
].join(" ");

function buildPrompt(opts: {
  premise: string;
  questionType?: QuestionType;
  listing?: boolean;
}): string {
  const lines: string[] = [];
  lines.push(`Premise: ${opts.premise || "unspecified"}`);
  if (opts.questionType) {
    const spec = getQuestionSpec(opts.questionType);
    lines.push(`Technique: ${spec.title}.`);
    lines.push(`Guidance: ${spec.question}`);
    lines.push(`Worked example: ${spec.example}`);
    lines.push(
      "Give 5 short candidate angles that apply this exact technique to the premise.",
    );
  } else if (opts.listing) {
    lines.push("Technique: the Listing Method.");
    lines.push(LISTING_HINT);
    lines.push(
      "Give 5 short concrete items mined from the element. Go into the minutiae.",
    );
  } else {
    lines.push("Give 5 short candidate angles for this premise.");
  }
  return lines.join("\n");
}

export async function suggestAngles(
  settings: Settings,
  opts: { premise: string; questionType?: QuestionType; listing?: boolean },
): Promise<string[]> {
  if (!aiEnabled(settings)) return [];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": settings.anthropicKey.trim(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.anthropicModel || "claude-opus-4-8",
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(opts) }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string =
    data?.content?.map((c: { text?: string }) => c.text ?? "").join("\n") ?? "";

  return content
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)]+/, "").trim())
    .map((l) => stripDashes(l))
    .filter((l) => l.length > 0)
    .slice(0, 5);
}
