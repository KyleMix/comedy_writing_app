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

// Words that read as content but make poor subjects or pivots: vague nouns,
// common verbs, and filler adjectives. We do not delete them, we just score
// them down so a concrete noun wins the pick.
const WEAK_WORDS = new Set([
  "thing","things","stuff","way","ways","lot","lots","time","times","kind",
  "sort","bit","part","stuff","everything","anything","something","nothing",
  "everyone","someone","anyone","nobody","everybody","somebody",
  "impossible","possible","weird","crazy","insane","normal","nice","good",
  "bad","great","terrible","awful","amazing","cool","fine","okay","sure",
  "reach","reached","want","wanted","need","needed","feel","feels","felt",
  "know","knew","think","thought","said","says","saying","tell","told","make",
  "makes","made","take","takes","took","give","gave","going","gonna","gotta",
  "trying","tried","being","doing","done","keep","kept","let","lets","put",
  "look","looks","looked","seem","seems","came","come","comes","went","goes",
]);

// Suffixes that signal a noun. A light boost, not a hard rule.
const NOUN_SUFFIXES = [
  "tion","sion","ment","ness","ity","ship","hood","ery","age","ance","ence",
  "ist","ism","or","er","ician",
];
// Suffixes that signal a verb or adverb. A light penalty.
const VERB_SUFFIXES = ["ing","ed","ize","ise","ify"];

// Common words that carry a usable second meaning. The pivot picker prefers
// these because a double entendre lives in exactly this kind of word. When
// nothing matches it falls back to the highest scoring noun.
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
  band: "a music band, a rubber band, a wedding band",
  bill: "a money bill, a restaurant bill, a duck bill, a name",
  block: "a city block, to obstruct, a toy block",
  board: "a wood board, to get on, a group of directors",
  bolt: "a metal bolt, to run, a lightning bolt",
  boot: "a shoe, a car trunk, to start up, to kick out",
  bow: "to bend, a ribbon bow, a weapon bow, the front of a ship",
  box: "a container, to fight, a TV box",
  brush: "a hair brush, to graze, underbrush",
  bug: "an insect, a glitch, to annoy, a hidden mic",
  can: "a tin can, to be able, the toilet, to fire someone",
  cap: "a hat, a limit, a bottle cap, to shoot",
  case: "a legal case, a container, a situation",
  cast: "a movie cast, a broken arm cast, to throw",
  change: "loose coins, to swap, transformation",
  chip: "a snack, a poker chip, a computer chip, a small break",
  coach: "a sports coach, a bus, a class of seat",
  court: "a tennis court, a law court, to woo",
  cross: "to traverse, a religious cross, angry",
  crown: "a king crown, the top of the head, a tooth crown",
  cut: "a wound, to slice, a pay cut, a film cut",
  deck: "a card deck, a ship deck, a patio, to punch",
  duck: "a bird, to dodge",
  fan: "a cooling fan, an admirer",
  file: "a paper file, a computer file, a nail file, a line",
  fire: "a flame, to shoot, to dismiss, passion",
  fish: "an animal, to angle, to search",
  flat: "not bumpy, an apartment, a flat tire, a music flat",
  fly: "an insect, to soar, pants zipper, stylish",
  foot: "a body foot, a measurement, the bottom of something",
  frame: "a picture frame, to set up someone, a body build",
  game: "a game to play, wild animals hunted, willing",
  ground: "the earth, to punish, electrical ground, crushed",
  hand: "a body hand, to give, a clock hand, a card hand",
  head: "a body head, a boss, a toilet, the front",
  hook: "a fishing hook, a song hook, to catch, a punch",
  joint: "a body joint, a shared place, a rolled smoke",
  lap: "a body lap, a race lap, to drink",
  lead: "the metal, to guide, a clue, the main role",
  letter: "an alphabet letter, a mailed letter",
  lie: "an untruth, to recline",
  line: "a queue, a phone line, a pickup line, a drug line",
  lock: "a door lock, a hair lock, a wrestling hold",
  mine: "belonging to me, a coal mine, an explosive",
  mint: "the herb, money mint, brand new, a candy",
  mole: "a skin mole, an animal, a spy",
  nail: "a metal nail, a finger nail, to succeed",
  net: "a fishing net, after costs, the internet, a goal net",
  organ: "a body organ, a musical organ",
  pad: "a cushion, an apartment, to inflate a bill",
  palm: "a hand palm, a palm tree, to conceal",
  pass: "to go by, a permission pass, a sports pass, a mountain pass",
  pen: "a writing pen, an animal pen, a prison",
  pick: "to choose, a guitar pick, a tool",
  pit: "a hole, a fruit pit, an armpit, a race pit",
  plane: "an airplane, a flat surface, a tool",
  plant: "a green plant, a factory, to place, a spy",
  play: "to have fun, a theater play, a sports play",
  pool: "a swimming pool, a betting pool, to combine",
  pop: "a sound, soda, dad, popular music",
  post: "a mail post, a wooden post, to publish, a job post",
  pound: "a weight, money, to hit, a dog pound",
  press: "to push, the news media, a printing press",
  punch: "to hit, a drink, a hole tool",
  pupil: "a student, the eye pupil",
  racket: "a tennis racket, a loud noise, a scam",
  range: "a span, a mountain range, a kitchen range, a shooting range",
  record: "a vinyl record, to capture, a best mark",
  rest: "to relax, the remainder, a music rest",
  rose: "a flower, past tense of rise",
  row: "a line, to paddle, an argument",
  ruler: "a measuring ruler, a king or queen",
  run: "to jog, to manage, a stocking run, a baseball run",
  school: "a place to learn, a group of fish",
  screen: "a TV screen, a window screen, to filter",
  season: "a part of the year, to add spice, a show season",
  shake: "to tremble, a milkshake, a handshake",
  sign: "a road sign, to write your name, an omen",
  sole: "the only one, a shoe sole, a fish",
  space: "outer space, room, a gap, to zone out",
  spell: "to write letters, a magic spell, a short period",
  spot: "a stain, a place, to notice, a small amount",
  stamp: "a mail stamp, to stomp, to imprint",
  stand: "to rise, a food stand, a position, a stadium stand",
  state: "a US state, a condition, to declare",
  steal: "to rob, a great bargain, a baseball steal",
  stock: "store inventory, company shares, soup stock, livestock",
  strike: "to hit, a labor strike, a bowling strike, a baseball strike",
  stroke: "to pet, a medical stroke, a swimming stroke, a brush stroke",
  suit: "a clothing suit, a card suit, a lawsuit, to fit",
  swallow: "to gulp, a bird",
  switch: "to swap, a light switch, a thin stick",
  tank: "a water tank, a war tank, to fail",
  tap: "to lightly hit, a water tap, to wiretap, tap dance",
  tear: "to rip, a crying tear",
  tick: "a clock tick, an insect, a check mark",
  tie: "a neck tie, to bind, an even score",
  tip: "a gratuity, advice, the end point, to topple",
  toast: "grilled bread, a celebratory toast, doomed",
  tongue: "a body tongue, a language, a shoe tongue",
  top: "the highest part, a spinning toy, a shirt",
  trunk: "a tree trunk, a car trunk, an elephant trunk, luggage",
  vault: "a bank vault, to leap, a ceiling vault",
  volume: "loudness, a book volume, an amount of space",
  ward: "a hospital ward, a city ward, a guarded person",
  wind: "moving air, to coil",
  wire: "a metal wire, to send money, a hidden mic",
  yard: "a measurement, a back yard, a rail yard",
  rent: "a housing payment, torn or ripped apart",
  slot: "a machine slot, a time slot, an opening",
  spare: "an extra, to show mercy, a bowling spare",
  bound: "tied up, headed somewhere, a leap, a limit",
  content: "satisfied, the stuff inside",
  object: "a thing, to protest, a grammar object",
  refuse: "to say no, garbage",
  produce: "to make, fruits and vegetables",
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
    // Allow two letter content words so short but real subjects survive
    // (ex, tv). Genuine two letter function words are already stopwords.
    if (w.length < 2 || STOPWORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

// A light part of speech weight. Higher means more likely to be a concrete,
// usable noun: the kind of word a joke can be built on. This is a heuristic,
// not a parser, but it reliably steers the pick away from verbs and filler.
export function nounScore(word: string): number {
  let score = Math.min(word.length, 10) * 0.4;
  if (WEAK_WORDS.has(word)) score -= 4;
  if (DOUBLE_MEANINGS[word]) score += 2;
  if (NOUN_SUFFIXES.some((s) => word.endsWith(s))) score += 2;
  if (VERB_SUFFIXES.some((s) => word.endsWith(s))) score -= 2.5;
  if (word.endsWith("ly")) score -= 3; // adverb
  return score;
}

// The strongest usable words, best noun first. Stable on ties so earlier
// words win, since the thing a joke is about tends to land early.
export function keywords(text: string, n = 4): string[] {
  const words = contentWords(text);
  return words
    .map((w, i) => ({ w, i, s: nounScore(w) }))
    .sort((a, b) => (b.s !== a.s ? b.s - a.s : a.i - b.i))
    .slice(0, n)
    .map((x) => x.w);
}

export function subjectGuess(text: string): string {
  // The subject is usually an early, strong noun. Weigh score but keep a
  // bias toward words that appear near the front of the line.
  const words = contentWords(text);
  if (words.length === 0) return "";
  let best = words[0];
  let bestScore = -Infinity;
  words.forEach((w, i) => {
    const positional = i < 5 ? (5 - i) * 0.6 : 0;
    const s = nounScore(w) + positional;
    if (s > bestScore) {
      bestScore = s;
      best = w;
    }
  });
  return best;
}

export interface Pivot {
  word: string;
  meanings: string | null; // known second meanings, if any
}

export function pivotWord(text: string): Pivot | null {
  const words = contentWords(text);
  // Prefer a word with a known second meaning, scanning in reading order.
  for (const w of words) {
    if (DOUBLE_MEANINGS[w]) return { word: w, meanings: DOUBLE_MEANINGS[w] };
  }
  // Otherwise the strongest noun is the best candidate to interrogate.
  const top = keywords(text, 1)[0];
  return top ? { word: top, meanings: null } : null;
}

// Two strong nouns that could be made to collide for an incongruity joke.
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
