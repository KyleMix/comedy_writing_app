import type { QuestionType, ListingCategory } from "./types";

// The methodology is the engine. Source: Jerry Corley method, Hot Breath! podcast #197.
// No comedy theory is invented here. This is the spec, implemented literally.
// No em dashes anywhere in this copy.

export interface QuestionSpec {
  type: QuestionType;
  order: number;
  label: string; // short bubble label
  title: string; // panel heading
  question: string; // the exact guiding question
  example: string; // the worked example from the methodology
}

export const THREE_QUESTIONS: QuestionSpec[] = [
  {
    type: "double_entendre",
    order: 1,
    label: "Double entendre",
    title: "Is there a double entendre at play",
    question:
      "Is there a word with an implied meaning you can turn comedic. Find the word, then turn it. Quick quip, then continue the story.",
    example:
      'Wife says "I am having some gas pains." Response: "Well, everyone is. It is like five bucks a gallon."',
  },
  {
    type: "converging",
    order: 2,
    label: "Converging ideas",
    title: "Are two dissimilar ideas converging",
    question:
      "If two dissimilar ideas are colliding in this sentence, build an incongruity joke from the collision.",
    example:
      "Look for the moment where two unrelated ideas sit side by side. The friction between them is the joke.",
  },
  {
    type: "shatter_assumption",
    order: 3,
    label: "Shatter assumption",
    title: "Is there an assumption I can shatter",
    question:
      "Find what the audience assumes from the setup, then break it. Name the assumption, then snap it.",
    example:
      'I am home teaching my daughter how to tie her shoes, which is weird, she is 17.',
  },
];

// The fallback questions interrogate the premise itself, not a single
// sentence. Where the three core questions are convergent (is there an X on
// this line), these are divergent: they push off the premise into angles
// that are not on the page yet. Each is built to break the obvious first
// answer, and every answer can be promoted into its own premise. That loop
// is the brain movement that finds the weirder, less obvious joke.
export const FALLBACK_QUESTIONS: QuestionSpec[] = [
  {
    type: "literal",
    order: 1,
    label: "Take it literally",
    title: "Make the figure of speech literally true",
    question:
      "Find the figurative phrase in the premise and build the world where it is physically, stupidly true. Live in that world for a beat.",
    example:
      "Impossible to reach. She bought a house at an altitude where my phone gives up. I get one bar and a nosebleed.",
  },
  {
    type: "escalate",
    order: 2,
    label: "Escalate it",
    title: "Escalate it. And then what is worse",
    question:
      "Take your answer and ask, and then what is even worse. Do it three times. Each beat must top the one before. You are building a run of laughs off one setup, not a single joke.",
    example:
      "She is impossible to reach. So I called. Then I texted. Then I drove over. Then I realized I have not had her number since 2019 and I have been doing this to a stranger.",
  },
  {
    type: "worst_person",
    order: 3,
    label: "Worst person",
    title: "Who is the worst person to be inside this",
    question:
      "Who is the worst, weirdest, or least qualified person to be stuck in this premise. Put them there and let it play.",
    example:
      "A professional hostage negotiator who still cannot get his ex to pick up the phone.",
  },
  {
    type: "hidden_shame",
    order: 4,
    label: "Hidden shame",
    title: "What is the premise secretly admitting",
    question:
      "What is this premise embarrassed about. What does it quietly confess about you. Aim the joke back at the narrator.",
    example:
      "Impossible to reach admits one thing: I am still the one trying.",
  },
  {
    type: "reverse_power",
    order: 5,
    label: "Reverse power",
    title: "Flip who has the power",
    question:
      "Who holds the power in this premise. Flip it completely and describe the new arrangement.",
    example:
      "She is unreachable because I am the one being screened now, by a system, like a customer on hold with my own ex.",
  },
  {
    type: "wrong_frame",
    order: 6,
    label: "Wrong frame",
    title: "Describe it in the wrong vocabulary",
    question:
      "Narrate this premise in the language of a totally unrelated field: nature documentary, tech support, war, sports, religion.",
    example:
      "My ex has gone fully off grid. Experts believe she is migrating.",
  },
  {
    type: "alien_dog",
    order: 7,
    label: "Alien or dog",
    title: "Read it with no human context",
    question:
      "How would a being with no human context read this exact situation: an alien, a dog, a toddler, a Victorian. Strip it to the absurd mechanics.",
    example:
      "A dog watching me redial: this man keeps yelling into a brick and getting sad.",
  },
  {
    type: "emotional_xray",
    order: 8,
    label: "Emotional X-ray",
    title: "What do you irrationally feel about this",
    question:
      "Name the feeling under the premise, the one that is out of proportion. State it like it is a reasonable universal law. The take is the joke. The words just deliver it.",
    example:
      "It should be a federal crime to change your number without telling the people who are not over it yet.",
  },
  {
    type: "assumption_stack",
    order: 9,
    label: "Assumption stack",
    title: "List the assumptions, snap the safest one",
    question:
      "List three things the audience assumes are normal in this premise. Then break the one nobody would think to question.",
    example:
      "We assume I want to reach her, that she has a phone, that we broke up. Snap the last one: we never dated, I just will not let it go.",
  },
  {
    type: "own_fault",
    order: 10,
    label: "Make it your fault",
    title: "Rewrite it so you are the problem",
    question:
      "Rewrite the premise so the narrator is the actual problem. Self incrimination raises the stakes and your likability at once.",
    example:
      "She is impossible to reach in the way a restraining order makes someone impossible to reach.",
  },
];

const ALL_QUESTIONS: QuestionSpec[] = [...THREE_QUESTIONS, ...FALLBACK_QUESTIONS];

export function getQuestionSpec(type: QuestionType): QuestionSpec {
  return ALL_QUESTIONS.find((q) => q.type === type) ?? THREE_QUESTIONS[0];
}

export const GO_WEIRDER_HELP =
  "The three questions find the obvious joke on a line. These push off the premise into angles that are not on the page yet. Answer one, then promote the answer into its own premise to keep the brain moving.";

export const TAG_PASS_HELP =
  "The fastest way to raise laughs per minute is to get more punches on a setup you already paid for. A tag is a second punch on the same setup. A topper punches the punchline itself. Write the obvious one, then reach for one more.";

export const LISTING_CATEGORIES: ListingCategory[] = [
  "People",
  "Places",
  "Things",
  "Words",
  "Phrases",
  "Cliches",
  "Events",
];

export const LISTING_HINT =
  "Go into the minutiae. Signal, bars, chargers, dropped calls. The double entendres hide in the small details. When you are close to the material you get heady and skip lanes, so write every item down.";

export const ANALOGY_GOLDEN_RULE =
  "The punchline must be true for both sides of the analogy on its own. If the tie in only fits one side, it sounds forced and dies.";

export const ANALOGY_WORKED_EXAMPLE =
  'My ex is like a smartphone. At any given time I can usually find her at at least one bar. True for the phone, signal bars. True for the ex, drinking establishment. Same phrase fits both. That is why it works.';

export const ANALOGY_ANTAGONISTIC_NUDGE =
  "An antagonistic frame like my ex gives the joke more edge to play against than a neutral one like my girlfriend.";

export const ANALOGY_DIRECTIONS = {
  element_first: {
    label: "Element first",
    help: "Pick an element, list everything about it across the seven subcategories, then find traits that connect to your subject.",
  },
  trait_first: {
    label: "Trait first",
    help: 'Start with a trait of your subject, then hunt for an element that shares it. Example: ex was an alcoholic, ask what else is alcohol fueled, a funny car is. "My ex-wife is like a funny car. Alcohol fueled."',
  },
};

export const CLICHE_HELP =
  "Cliche reformation: twist a familiar phrase into a new comedic meaning. Keep a running list of cliches related to the topic, then reform one into a fresh punchline.";

export const STORY_ELEMENTS_LABELS = {
  setting: "Setting",
  theme: "Theme",
  plot: "Plot",
  character: "Character",
  conflict: "Conflict",
};

export const JOURNALISM_LABELS = {
  who: "Who",
  what: "What",
  where: "Where",
  why: "Why",
  when: "When",
  how: "How",
  moral: "Moral arc",
};

export const STORY_HELP =
  "Before tagging, confirm the story has its bones. A great story with no laughs goes on forever. Technique is how you drop the laughs in. This is guidance, not a hard block.";

export const CORE_PRINCIPLE =
  "Every sentence is a setup. Write the story straight with no jokes, then go sentence by sentence and tag each sentence, or every third, with a quick quip. Quips on the way to the big joke equal more laughs per minute.";

export const QUICK_REFERENCE: string[] = [
  "Write the story straight. No jokes yet.",
  "Confirm the five story elements are present.",
  "Go sentence by sentence and ask the three questions.",
  "Layer in cliche reformations and forced analogies.",
  "For analogies, list subcategories of the element, find what is true for both sides, and solve for true.",
  "Tag every sentence you can, or every third. Quips on the way to the big joke equal laughs per minute.",
];
