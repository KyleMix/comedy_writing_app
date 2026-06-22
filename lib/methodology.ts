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

export function getQuestionSpec(type: QuestionType): QuestionSpec {
  return THREE_QUESTIONS.find((q) => q.type === type) ?? THREE_QUESTIONS[0];
}

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
