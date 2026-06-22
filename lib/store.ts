"use client";

import { create } from "zustand";
import type {
  Board,
  BoardMeta,
  JokeEdge,
  JokeNode,
  NodeKind,
  Settings,
  Viewport,
} from "./types";
import {
  buildPremiseChildren,
  makeNode,
  now,
  radialPositions,
  stripDashes,
  uid,
} from "./utils";
import {
  deleteBoard,
  getActiveBoardId,
  listBoards,
  loadBoard,
  loadSettings,
  saveBoard,
  saveSettings,
  setActiveBoardId,
} from "./storage";
import { FALLBACK_QUESTIONS } from "./methodology";
import { splitSentences, keywords } from "./textAnalysis";

interface JokeForgeState {
  hydrated: boolean;
  boardId: string | null;
  boardName: string;
  nodes: JokeNode[];
  edges: JokeEdge[];
  viewport: Viewport;
  boards: BoardMeta[];
  settings: Settings;

  selectedNodeId: string | null;

  // lifecycle
  hydrate: () => Promise<void>;
  refreshBoards: () => Promise<void>;
  createBoard: (name?: string) => Promise<string>;
  switchBoard: (id: string) => Promise<void>;
  renameBoard: (id: string, name: string) => Promise<void>;
  duplicateBoard: (id: string) => Promise<string>;
  removeBoard: (id: string) => Promise<void>;

  // settings
  updateSettings: (patch: Partial<Settings>) => Promise<void>;

  // selection
  selectNode: (id: string | null) => void;

  // viewport
  setViewport: (vp: Viewport) => void;

  // node mutations
  setPremiseText: (id: string, text: string) => void;
  updateNode: (id: string, patch: Partial<JokeNode>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;

  addIdeaChild: (parentId: string, text: string, extra?: Partial<JokeNode>) => string;
  addPremise: (text?: string) => string;
  addAnalogyTo: (parentId: string) => string;
  addClicheTo: (parentId: string) => string;
  addStoryTo: (parentId: string) => string;
  spawnFallbackQuestions: (premiseId: string) => void;
  submitFullJoke: (text: string) => string;
  addTag: (parentId: string, text: string, tagType: "tag" | "topper") => string;
  addJokeChild: (parentId: string, text: string) => string;
  promoteToPremise: (nodeId: string) => string;
  confirmAsJoke: (nodeId: string) => string;
  toggleInSet: (nodeId: string) => void;
}

function getBoardSnapshot(state: JokeForgeState): Board {
  return {
    id: state.boardId as string,
    name: state.boardName,
    nodes: state.nodes,
    edges: state.edges,
    viewport: state.viewport,
    createdAt:
      state.boards.find((b) => b.id === state.boardId)?.createdAt ?? now(),
    updatedAt: now(),
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<JokeForgeState>((setState, getState) => {
  // Autosave on every mutation, debounced lightly so rapid typing does
  // not thrash IndexedDB. The whole board is persisted.
  function persist() {
    const state = getState();
    if (!state.boardId) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const snapshot = getBoardSnapshot(getState());
      void saveBoard(snapshot);
    }, 150);
  }

  function touch() {
    persist();
  }

  return {
    hydrated: false,
    boardId: null,
    boardName: "Untitled set",
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    boards: [],
    settings: {
      anthropicKey: "",
      anthropicModel: "claude-opus-4-8",
      googleClientId: "",
    },
    selectedNodeId: null,

    hydrate: async () => {
      const settings = await loadSettings();
      const boards = await listBoards();
      let activeId = await getActiveBoardId();

      if (!activeId || !boards.find((b) => b.id === activeId)) {
        if (boards.length > 0) {
          activeId = boards[0].id;
        }
      }

      if (activeId) {
        const board = await loadBoard(activeId);
        if (board) {
          await setActiveBoardId(activeId);
          setState({
            hydrated: true,
            boardId: board.id,
            boardName: board.name,
            nodes: board.nodes,
            edges: board.edges,
            viewport: board.viewport,
            boards,
            settings,
          });
          return;
        }
      }

      // No boards yet. Create a fresh one with an empty premise hub.
      setState({ boards, settings });
      await getState().createBoard("Untitled set");
      setState({ hydrated: true });
    },

    refreshBoards: async () => {
      const boards = await listBoards();
      setState({ boards });
    },

    createBoard: async (name = "Untitled set") => {
      const id = uid();
      const premise = makeNode("premise", {
        title: "Premise",
        body: "",
        position: { x: 0, y: 0 },
      });
      const board: Board = {
        id,
        name,
        nodes: [premise],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: now(),
        updatedAt: now(),
      };
      await saveBoard(board);
      await setActiveBoardId(id);
      const boards = await listBoards();
      setState({
        boardId: id,
        boardName: name,
        nodes: board.nodes,
        edges: board.edges,
        viewport: board.viewport,
        boards,
        selectedNodeId: premise.id,
      });
      return id;
    },

    switchBoard: async (id) => {
      const board = await loadBoard(id);
      if (!board) return;
      await setActiveBoardId(id);
      setState({
        boardId: board.id,
        boardName: board.name,
        nodes: board.nodes,
        edges: board.edges,
        viewport: board.viewport,
        selectedNodeId: null,
      });
    },

    renameBoard: async (id, name) => {
      const clean = stripDashes(name);
      const board = await loadBoard(id);
      if (board) {
        board.name = clean;
        board.updatedAt = now();
        await saveBoard(board);
      }
      if (getState().boardId === id) {
        setState({ boardName: clean });
      }
      await getState().refreshBoards();
    },

    duplicateBoard: async (id) => {
      const board = await loadBoard(id);
      if (!board) return id;
      const newId = uid();
      const copy: Board = {
        ...board,
        id: newId,
        name: `${board.name} copy`,
        createdAt: now(),
        updatedAt: now(),
      };
      await saveBoard(copy);
      await getState().refreshBoards();
      return newId;
    },

    removeBoard: async (id) => {
      await deleteBoard(id);
      const boards = await listBoards();
      setState({ boards });
      if (getState().boardId === id) {
        if (boards.length > 0) {
          await getState().switchBoard(boards[0].id);
        } else {
          await getState().createBoard("Untitled set");
        }
      }
    },

    updateSettings: async (patch) => {
      const next = { ...getState().settings, ...patch };
      setState({ settings: next });
      await saveSettings(next);
    },

    selectNode: (id) => setState({ selectedNodeId: id }),

    setViewport: (vp) => {
      setState({ viewport: vp });
      touch();
    },

    setPremiseText: (id, text) => {
      const clean = stripDashes(text);
      const state = getState();
      const node = state.nodes.find((n) => n.id === id);
      if (!node) return;
      const wasEmpty = node.body.trim().length === 0;
      const updated = state.nodes.map((n) =>
        n.id === id
          ? { ...n, body: clean, title: clean.slice(0, 60) || "Premise", updatedAt: now() }
          : n,
      );

      // Auto spawn the four bubbles the first time a premise gets text,
      // but only if it has no children yet.
      const hasChildren = state.edges.some((e) => e.source === id);
      if (wasEmpty && clean.trim().length > 0 && !hasChildren) {
        const { nodes: children } = buildPremiseChildren(node);
        const newEdges: JokeEdge[] = children.map((c) => ({
          id: uid(),
          source: id,
          target: c.id,
        }));
        setState({
          nodes: [...updated, ...children],
          edges: [...state.edges, ...newEdges],
        });
      } else {
        setState({ nodes: updated });
      }
      touch();
    },

    updateNode: (id, patch) => {
      const state = getState();
      const cleaned: Partial<JokeNode> = { ...patch };
      if (typeof cleaned.body === "string") cleaned.body = stripDashes(cleaned.body);
      if (typeof cleaned.title === "string") cleaned.title = stripDashes(cleaned.title);
      setState({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, ...cleaned, updatedAt: now() } : n,
        ),
      });
      touch();
    },

    moveNode: (id, position) => {
      const state = getState();
      setState({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, position } : n,
        ),
      });
      touch();
    },

    removeNode: (id) => {
      const state = getState();
      const node = state.nodes.find((n) => n.id === id);
      // Never delete the root premise of the board.
      if (node?.kind === "premise" && node.parentId === null) return;

      // Cascade delete descendants.
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const e of state.edges) {
          if (toDelete.has(e.source) && !toDelete.has(e.target)) {
            toDelete.add(e.target);
            changed = true;
          }
        }
      }
      setState({
        nodes: state.nodes.filter((n) => !toDelete.has(n.id)),
        edges: state.edges.filter(
          (e) => !toDelete.has(e.source) && !toDelete.has(e.target),
        ),
        selectedNodeId:
          state.selectedNodeId && toDelete.has(state.selectedNodeId)
            ? null
            : state.selectedNodeId,
      });
      touch();
    },

    addIdeaChild: (parentId, text, extra = {}) => {
      const state = getState();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return "";
      const siblings = state.edges.filter((e) => e.source === parentId).length;
      const positions = radialPositions(parent.position, 6, 240);
      const pos = positions[siblings % positions.length];
      const clean = stripDashes(text);
      const node = makeNode("idea", {
        parentId,
        title: clean.slice(0, 60),
        body: clean,
        position: pos,
        ...extra,
      });
      const edge: JokeEdge = { id: uid(), source: parentId, target: node.id };
      setState({
        nodes: [...state.nodes, node],
        edges: [...state.edges, edge],
      });
      touch();
      return node.id;
    },

    addPremise: (text = "") => {
      const state = getState();
      const clean = stripDashes(text);
      // Drop the new hub clear of everything already on the board.
      const x =
        state.nodes.length > 0
          ? Math.max(...state.nodes.map((n) => n.position.x)) + 760
          : 0;
      const premise = makeNode("premise", {
        body: clean,
        title: clean.slice(0, 60) || "Premise",
        position: { x, y: 0 },
      });
      let nodes = [...state.nodes, premise];
      let edges = [...state.edges];
      // If it arrives with text, spawn the standard bubbles so the Map view
      // stays consistent with a premise typed on the canvas.
      if (clean.trim()) {
        const { nodes: children } = buildPremiseChildren(premise);
        nodes = [...nodes, ...children];
        edges = [
          ...edges,
          ...children.map((c) => ({
            id: uid(),
            source: premise.id,
            target: c.id,
          })),
        ];
      }
      setState({ nodes, edges, selectedNodeId: premise.id });
      touch();
      return premise.id;
    },

    addAnalogyTo: (parentId) => {
      const state = getState();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return "";
      const pos = {
        x: parent.position.x + 280,
        y: parent.position.y + 160,
      };
      const node = makeNode("analogy", {
        parentId,
        title: "Forced analogy",
        body: "",
        subject: parent.kind === "premise" ? parent.body : "",
        element: "",
        analogyDirection: "element_first",
        trueForSubject: false,
        trueForElement: false,
        position: pos,
      });
      const edge: JokeEdge = { id: uid(), source: parentId, target: node.id };
      setState({
        nodes: [...state.nodes, node],
        edges: [...state.edges, edge],
        selectedNodeId: node.id,
      });
      touch();
      return node.id;
    },

    addClicheTo: (parentId) => {
      const state = getState();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return "";
      const pos = {
        x: parent.position.x - 280,
        y: parent.position.y + 160,
      };
      const node = makeNode("cliche", {
        parentId,
        title: "Cliche reformation",
        body: "",
        clicheList: [],
        position: pos,
      });
      const edge: JokeEdge = { id: uid(), source: parentId, target: node.id };
      setState({
        nodes: [...state.nodes, node],
        edges: [...state.edges, edge],
        selectedNodeId: node.id,
      });
      touch();
      return node.id;
    },

    addStoryTo: (parentId) => {
      const state = getState();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return "";
      const pos = {
        x: parent.position.x,
        y: parent.position.y - 280,
      };
      const node = makeNode("story", {
        parentId,
        title: "Story straight",
        body: "",
        storyElements: {
          setting: false,
          theme: false,
          plot: false,
          character: false,
          conflict: false,
        },
        journalism: {
          who: false,
          what: false,
          where: false,
          why: false,
          when: false,
          how: false,
          moral: false,
        },
        position: pos,
      });
      const edge: JokeEdge = { id: uid(), source: parentId, target: node.id };
      setState({
        nodes: [...state.nodes, node],
        edges: [...state.edges, edge],
        selectedNodeId: node.id,
      });
      touch();
      return node.id;
    },

    spawnFallbackQuestions: (premiseId) => {
      const state = getState();
      const premise = state.nodes.find((n) => n.id === premiseId);
      if (!premise) return;

      // Do not spawn twice. Skip any fallback types already present as
      // children of this premise.
      const existing = new Set(
        state.nodes
          .filter((n) => n.parentId === premiseId && n.questionType)
          .map((n) => n.questionType),
      );
      const pending = FALLBACK_QUESTIONS.filter((q) => !existing.has(q.type));
      if (pending.length === 0) return;

      // Lay them in an outer ring so they do not crowd the core four. Rotate
      // the start angle to interleave with the inner ring.
      const positions = radialPositions(
        premise.position,
        pending.length,
        560,
        -Math.PI / 2 + Math.PI / pending.length,
      );
      const newNodes: JokeNode[] = pending.map((q, i) =>
        makeNode("question", {
          parentId: premiseId,
          questionType: q.type,
          title: q.label,
          body: "",
          position: positions[i],
        }),
      );
      const newEdges: JokeEdge[] = newNodes.map((n) => ({
        id: uid(),
        source: premiseId,
        target: n.id,
      }));
      setState({
        nodes: [...state.nodes, ...newNodes],
        edges: [...state.edges, ...newEdges],
      });
      touch();
    },

    submitFullJoke: (rawText) => {
      const state = getState();
      const text = stripDashes(rawText).trim();
      if (!text) return "";

      const sentences = splitSentences(text);
      // The thing the joke is about: lead on the first sentence, but anchor
      // the label on its strongest keyword so the hub reads cleanly.
      const lead = sentences[0] ?? text;
      const kw = keywords(lead, 2).join(", ");
      const premiseBody = lead;

      // Reuse a pristine root premise if the board has one, otherwise drop a
      // fresh hub clear of everything so several jokes can share a board.
      const pristineRoot = state.nodes.find(
        (n) =>
          n.kind === "premise" &&
          n.parentId === null &&
          n.body.trim().length === 0 &&
          !state.edges.some((e) => e.source === n.id),
      );

      let originX = 0;
      let originY = 0;
      if (!pristineRoot && state.nodes.length > 0) {
        originX = Math.max(...state.nodes.map((n) => n.position.x)) + 760;
      }

      const premise = pristineRoot
        ? { ...pristineRoot }
        : makeNode("premise", { position: { x: originX, y: originY } });

      premise.body = premiseBody;
      premise.title = (kw || premiseBody).slice(0, 60) || "Premise";
      premise.updatedAt = now();
      const px = premise.position.x;
      const py = premise.position.y;

      // The four standard improvement bubbles: three questions plus listing.
      const { nodes: bubbles } = buildPremiseChildren(premise);

      // Story node holds the full joke verbatim for reference.
      const story = makeNode("story", {
        parentId: premise.id,
        title: "Full joke",
        body: text,
        position: { x: px, y: py + 560 },
        storyElements: {
          setting: false,
          theme: false,
          plot: false,
          character: false,
          conflict: false,
        },
        journalism: {
          who: false,
          what: false,
          where: false,
          why: false,
          when: false,
          how: false,
          moral: false,
        },
      });

      // Setup beats: every sentence except the last, each individually
      // taggable. The last sentence becomes the confirmed punchline.
      const setups = sentences.length > 1 ? sentences.slice(0, -1) : [];
      const punchText =
        sentences.length > 0 ? sentences[sentences.length - 1] : text;

      const beatNodes: JokeNode[] = setups.map((s, i) =>
        makeNode("idea", {
          parentId: story.id,
          title: `Setup ${i + 1}`,
          body: s,
          position: { x: px + 320, y: py + 480 + i * 130 },
        }),
      );

      const punchline = makeNode("joke", {
        parentId: premise.id,
        title: punchText.slice(0, 60),
        body: punchText,
        confirmed: true,
        beatSeconds: 20,
        position: { x: px + 380, y: py - 360 },
      });

      const newNodes = [...bubbles, story, ...beatNodes, punchline];
      const newEdges: JokeEdge[] = [
        ...bubbles.map((b) => ({ id: uid(), source: premise.id, target: b.id })),
        { id: uid(), source: premise.id, target: story.id },
        ...beatNodes.map((b) => ({ id: uid(), source: story.id, target: b.id })),
        { id: uid(), source: premise.id, target: punchline.id },
      ];

      const baseNodes = pristineRoot
        ? state.nodes.map((n) => (n.id === premise.id ? premise : n))
        : [...state.nodes, premise];

      setState({
        nodes: [...baseNodes, ...newNodes],
        edges: [...state.edges, ...newEdges],
        selectedNodeId: premise.id,
      });
      touch();
      return premise.id;
    },

    addTag: (parentId, text, tagType) => {
      const state = getState();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return "";
      const clean = stripDashes(text);
      if (!clean.trim()) return "";
      // Tags and toppers are punches, so they land as confirmed joke nodes
      // that flow straight into the set as extra laughs per minute.
      const siblings = state.edges.filter((e) => e.source === parentId).length;
      const positions = radialPositions(parent.position, 6, 220);
      const pos = positions[siblings % positions.length];
      const node = makeNode("joke", {
        parentId,
        title: clean.slice(0, 60),
        body: clean,
        confirmed: true,
        tagType,
        beatSeconds: 8,
        position: pos,
      });
      const edge: JokeEdge = { id: uid(), source: parentId, target: node.id };
      setState({
        nodes: [...state.nodes, node],
        edges: [...state.edges, edge],
      });
      touch();
      return node.id;
    },

    addJokeChild: (parentId, text) => {
      const state = getState();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return "";
      const clean = stripDashes(text);
      if (!clean.trim()) return "";
      const siblings = state.edges.filter((e) => e.source === parentId).length;
      const positions = radialPositions(parent.position, 6, 240);
      const pos = positions[siblings % positions.length];
      const node = makeNode("joke", {
        parentId,
        title: clean.slice(0, 60),
        body: clean,
        confirmed: true,
        beatSeconds: 20,
        position: pos,
      });
      const edge: JokeEdge = { id: uid(), source: parentId, target: node.id };
      setState({
        nodes: [...state.nodes, node],
        edges: [...state.edges, edge],
      });
      touch();
      return node.id;
    },

    promoteToPremise: (nodeId) => {
      const state = getState();
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return "";
      const seedText = node.body || node.title;
      // Spin up a fresh premise hub seeded with this text, offset so it
      // does not land on top of the source bubble.
      const pos = {
        x: node.position.x + 120,
        y: node.position.y + 360,
      };
      const premise = makeNode("premise", {
        parentId: nodeId,
        title: seedText.slice(0, 60) || "Premise",
        body: seedText,
        position: pos,
      });
      const linkEdge: JokeEdge = {
        id: uid(),
        source: nodeId,
        target: premise.id,
      };

      // Seed its own set of question bubbles plus the listing bubble.
      const { nodes: children } = buildPremiseChildren(premise);
      const childEdges: JokeEdge[] = children.map((c) => ({
        id: uid(),
        source: premise.id,
        target: c.id,
      }));

      setState({
        nodes: [...state.nodes, premise, ...children],
        edges: [...state.edges, linkEdge, ...childEdges],
        selectedNodeId: premise.id,
      });
      touch();
      return premise.id;
    },

    confirmAsJoke: (nodeId) => {
      const state = getState();
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return "";

      // Golden rule gate for analogies: both sides must be true.
      if (
        node.kind === "analogy" &&
        !(node.trueForSubject && node.trueForElement)
      ) {
        return "";
      }

      // Create a linked joke node carrying the confirmed text.
      const jokeText =
        node.kind === "analogy"
          ? node.body ||
            `${node.subject} is like ${node.element}.`
          : node.body || node.title;
      const pos = {
        x: node.position.x + 60,
        y: node.position.y + 180,
      };
      const joke = makeNode("joke", {
        parentId: nodeId,
        title: jokeText.slice(0, 60),
        body: jokeText,
        confirmed: true,
        inSet: false,
        beatSeconds: 20,
        position: pos,
      });
      const edge: JokeEdge = { id: uid(), source: nodeId, target: joke.id };
      setState({
        nodes: [
          ...state.nodes.map((n) =>
            n.id === nodeId ? { ...n, confirmed: true, updatedAt: now() } : n,
          ),
          joke,
        ],
        edges: [...state.edges, edge],
        selectedNodeId: joke.id,
      });
      touch();
      return joke.id;
    },

    toggleInSet: (nodeId) => {
      const state = getState();
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const nextIn = !node.inSet;
      const maxOrder = state.nodes.reduce(
        (m, n) => (n.inSet && (n.order ?? 0) > m ? (n.order ?? 0) : m),
        0,
      );
      setState({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                inSet: nextIn,
                order: nextIn ? maxOrder + 1 : undefined,
                beatSeconds: n.beatSeconds ?? 20,
                updatedAt: now(),
              }
            : n,
        ),
      });
      touch();
    },
  };
});
