# Joke Forge

A local first tool for a stand up comedian to get jokes down fast, using a fixed
comedy methodology as the engine. Output above all else.

Three modes, with a top bar toggle:

- Forge, the default front door. You drop a premise and the app fires one
  tailored prompt at a time, attitude first, then the engines that fit your
  exact words. You write a joke against each prompt and capture it. A running
  Jokes list collects everything you write.
- Map, the optional node graph. The same premises and jokes shown as a web:
  the premise as a hub, question and idea bubbles breaking off it, any bubble
  promotable into its own premise. For when you want to see structure.
- Run the set, the performance mode. Order the jokes into a set, drill them on
  recall cards, and run a teleprompter.

Everything you capture in Forge is the same joke that shows up on the Map and in
the set, so the three modes are three views of one board.

## The methodology

Source: Jerry Corley method, Hot Breath! podcast 197. The app invents no comedy
theory. It implements the method literally.

- Core principle: every sentence is a setup. Write the story straight, then tag
  sentences with quick quips. Quips on the way to the big joke equal laughs per
  minute.
- Story gate: confirm the five story elements (setting, theme, plot, character,
  conflict) plus journalism basics before punching up. Guidance, not a hard block.
- The Three Questions, asked of every sentence in order: is there a double
  entendre, are two dissimilar ideas converging, is there an assumption I can
  shatter.
- Advanced structures: cliche reformation, and forced analogy with the golden
  rule that the punchline must be true for both sides on its own.
- The Listing Method: mine an element across People, Places, Things, Words,
  Phrases, Cliches, Events. The double entendres hide in the minutiae.

## Stack

- Next.js 15 App Router, TypeScript strict
- Tailwind CSS v3
- React Flow (@xyflow/react) for the canvas
- Framer Motion for transitions
- Zustand store, persisted to IndexedDB via idb-keyval
- Optional AI assist that calls the Anthropic Messages API client side, only when
  a key is set in Settings. The app runs fully offline. AI is additive only.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. You land in Forge. Type a premise, work the prompts,
and capture jokes into the list. Flip to Map to see the web, or Run the set to
order, drill, and run a teleprompter.

Everything autosaves to IndexedDB. Close the tab and come back to the same board.

## Brand

Single hazard yellow accent on near black. Fraunces for display, Inter for UI,
JetBrains Mono for raw joke text and the teleprompter. No em dashes anywhere.
