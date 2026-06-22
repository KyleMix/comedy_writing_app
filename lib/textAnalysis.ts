// Offline text analysis. No dependencies, no network. These heuristics let
// the question bubbles and scenario suggestions speak to the exact words a
// comedian entered, so the prompts feel specific even with no AI key. When a
// key is present, the AI layer sharpens on top of these.

const STOPWORDS = new Set([
  "the","a","an","and","or","but","so","if","then","than","that","this","these",
  "those","is","are","was","were","be","been","being","am","i","you","he","she",
  "it","we","they","me","him","her","us","them","my","your","his","its","our",
  "their","of","to","in","on","at","for","with","from","by","as","about","into",
  "over","after","before","up","down","out","off","just","not","no","yes","do",
  "does","did","have","has","had","will","would","can","could","should","there",
  "here","what","when","where","why","how","who","which","because","like","get",
  "got","one","some","any","all","more","most","very","really","im"," im","dont",
]);

// Common words that carry a usable second meaning. The list is small on
// purpose: it covers the words that reliably hide a double entendre, and the
// pivot picker falls back to the longest content word when nothing matches.
export const DOUBLE_MEANINGS: Record<string, string> = {
  bar: "a drink bar, a phone signal bar, a barrier, a law bar",
  gas: "fuel, a stomach feeling, something funny",
  bank: "a money bank, a river bank, to rely on",
  light: "not heavy, not dark, a cigarette light",
  date: "a calendar date, a romantic date, the fruit",
  ring: "a phone ring, a wedding ring, a boxing ring",
  charge: "a fee, an attack, an electrical charge",
  check: "a restaurant check, to inspect, a chess check",
  draft: "a cold breeze, a rough version, a sports draft, a beer draft",
  match: "a flame match, a sports match, a romantic match",
  current: "electrical current, a water current, up to date",
  club: "a night club, a weapon, a golf club, a group",
  fall: "to trip, the season, a decline",
  spring: "the season, a coil, to leap, a water spring",
  table: "furniture, to postpone, a data table",
  watch: "to look, a wristwatch, a guard shift",
  wave: "an ocean wave, a hand wave, a radio wave",
  bark: "a dog bark, tree bark",
  cold: "low temperature, unfeeling, an illness",
  fine: "okay, a penalty, high quality",
  hard: "difficult, solid, harsh",
  jam: "fruit jam, a traffic jam, to improvise",
  key: "a door key, important, a music key",
  mean: "unkind, to intend, an average",
  note: "a music note, a written note, to notice",
  present: "a gift, right now, to show",
  right: "correct, a direction, a legal right",
  saw: "a tool, past tense of see",
  scale: "to climb, a fish scale, a weight scale, a music scale",
  seal: "an animal, to close, a stamp",
  set: "a comedy set, to place, a group, ready",
  sink: "a kitchen sink, to go under",
  sound: "a noise, healthy, a body of water",
  star: "a celebrity, a sky star, to rate",
  stick: "a twig, to adhere, to poke",
  story: "a tale, a building floor",
  train: "a locomotive, to practice",
  trip: "a journey, to stumble, a drug trip",
  type: "a category, to key text",
  well: "healthy, a water well, an expression",
  bat: "an animal, a baseball bat, to blink",
  rock: "a stone, music, to sway",
  cell: "a phone, a prison cell, a body cell",
  shot: "a drink, a photo, a gunshot, an attempt",
  pitch: "a sales pitch, a baseball pitch, tar, a sound pitch",
  plot: "a story plot, a plan, a patch of land, a grave plot",
};

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function contentWords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokenize(text)) {
    const w = t.replace(/^'+|'+$/g, "");
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

// The most usable words to build off: longest content words first, since
// concrete nouns tend to be longer than filler and carry the imagery.
export function keywords(text: string, n = 4): string[] {
  return [...contentWords(text)]
    .sort((a, b) => b.length - a.length)
    .slice(0, n);
}

export function subjectGuess(text: string): string {
  // The first concrete content word is usually the thing the joke is about.
  return contentWords(text)[0] ?? "";
}

export interface Pivot {
  word: string;
  meanings: string | null; // known second meanings, if any
}

export function pivotWord(text: string): Pivot | null {
  const words = contentWords(text);
  for (const w of words) {
    if (DOUBLE_MEANINGS[w]) return { word: w, meanings: DOUBLE_MEANINGS[w] };
  }
  const longest = keywords(text, 1)[0];
  return longest ? { word: longest, meanings: null } : null;
}

// Two concrete nouns that could be made to collide for an incongruity joke.
export function convergingPair(text: string): [string, string] | null {
  const k = keywords(text, 3);
  if (k.length >= 2) return [k[0], k[1]];
  return null;
}

const PERSON_HINTS =
  /\b(ex|wife|husband|girlfriend|boyfriend|mom|mother|dad|father|brother|sister|friend|boss|kid|daughter|son|grandma|grandpa|cop|priest|teacher|doctor|she|he|they|him|her)\b/i;

export function subjectIsPerson(text: string): boolean {
  return PERSON_HINTS.test(text);
}
