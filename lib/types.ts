export type NodeKind =
  | "premise" // hub
  | "story" // straight story text, pre joke
  | "question" // one of the Three Questions
  | "idea" // an answer or candidate angle
  | "listing" // Listing Method brainstorm spawner
  | "analogy" // forced analogy with solve-for-true
  | "cliche" // cliche reformation with running list
  | "joke"; // confirmed tag or punchline

// The three core questions, asked of a sentence (convergent discovery).
export type CoreQuestionType =
  | "double_entendre"
  | "converging"
  | "shatter_assumption";

// The fallback questions, asked of the premise itself (divergent, weirder
// angles). Each answer can be promoted back into a premise, which is the
// recursion that drives brain movement.
export type FallbackQuestionType =
  | "literal"
  | "escalate"
  | "worst_person"
  | "hidden_shame"
  | "reverse_power"
  | "wrong_frame"
  | "alien_dog"
  | "emotional_xray"
  | "assumption_stack"
  | "own_fault";

export type QuestionType = CoreQuestionType | FallbackQuestionType;

export type ListingCategory =
  | "People"
  | "Places"
  | "Things"
  | "Words"
  | "Phrases"
  | "Cliches"
  | "Events";

export interface StoryElements {
  setting: boolean;
  theme: boolean;
  plot: boolean;
  character: boolean;
  conflict: boolean;
}

export interface JournalismBasics {
  who: boolean;
  what: boolean;
  where: boolean;
  why: boolean;
  when: boolean;
  how: boolean;
  moral: boolean;
}

export interface JokeNode {
  id: string;
  kind: NodeKind;
  title: string; // short label on the bubble
  body: string; // full text, JetBrains Mono in the editor panel
  parentId: string | null;
  position: { x: number; y: number };

  questionType?: QuestionType;
  listingCategory?: ListingCategory;

  // analogy fields
  subject?: string; // X
  element?: string; // Y
  analogyDirection?: "element_first" | "trait_first";
  trueForSubject?: boolean;
  trueForElement?: boolean; // both true required to confirm (golden rule)

  // cliche fields
  clicheList?: string[];

  // story gate
  storyElements?: StoryElements;
  journalism?: JournalismBasics;

  confirmed?: boolean; // a joke node a comedian has locked
  inSet?: boolean; // included in performance set
  order?: number; // position in the performance set
  beatSeconds?: number; // estimated time for this beat in the set

  // density and recall multipliers
  tagType?: "tag" | "topper"; // a tag is a second punch on the setup, a topper punches the punchline
  physical?: boolean; // act it out instead of telling it
  callback?: boolean; // a recurring image to pay off later

  // recall drill tracking
  recallMisses?: number;

  createdAt: number;
  updatedAt: number;
}

export interface JokeEdge {
  id: string;
  source: string;
  target: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Board {
  id: string;
  name: string;
  nodes: JokeNode[];
  edges: JokeEdge[];
  viewport: Viewport;
  createdAt: number;
  updatedAt: number;
}

export interface BoardMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  anthropicKey: string;
  anthropicModel: string;
}
