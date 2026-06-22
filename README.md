# Joke Forge

A local first node graph workbench that helps a stand up comedian develop a joke
outward from a single premise, using a fixed comedy methodology as the engine.

The premise sits at the center as a hub. Question bubbles break off the hub.
Answers become idea bubbles. Any idea bubble can be promoted into its own premise
hub, so the board grows recursively into a web of jokes. A performance mode then
linearizes a chosen path into a memorizable set.

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

Open http://localhost:3000. Type a premise. The three questions and the listing
bubble pop out. Answer them, branch ideas, force analogies, confirm jokes, then
switch to Run the set to build, drill, and run a teleprompter.

Everything autosaves to IndexedDB. Close the tab and come back to the same board.

## Brand

Single hazard yellow accent on near black. Fraunces for display, Inter for UI,
JetBrains Mono for raw joke text and the teleprompter. No em dashes anywhere.
