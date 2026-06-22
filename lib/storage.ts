import { get, set, del, keys } from "idb-keyval";
import type { Board, BoardMeta, Settings } from "./types";

// Local first persistence. Everything lives in IndexedDB. No backend.

const BOARD_PREFIX = "jokeforge:board:";
const SETTINGS_KEY = "jokeforge:settings";
const ACTIVE_BOARD_KEY = "jokeforge:active-board";

function boardKey(id: string): string {
  return `${BOARD_PREFIX}${id}`;
}

export async function saveBoard(board: Board): Promise<void> {
  await set(boardKey(board.id), board);
}

export async function loadBoard(id: string): Promise<Board | undefined> {
  return get<Board>(boardKey(id));
}

export async function deleteBoard(id: string): Promise<void> {
  await del(boardKey(id));
}

export async function listBoards(): Promise<BoardMeta[]> {
  const allKeys = (await keys()) as string[];
  const boardKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(BOARD_PREFIX),
  );
  const boards: BoardMeta[] = [];
  for (const k of boardKeys) {
    const board = await get<Board>(k);
    if (board) {
      boards.push({
        id: board.id,
        name: board.name,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      });
    }
  }
  return boards.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getActiveBoardId(): Promise<string | undefined> {
  return get<string>(ACTIVE_BOARD_KEY);
}

export async function setActiveBoardId(id: string): Promise<void> {
  await set(ACTIVE_BOARD_KEY, id);
}

export async function loadSettings(): Promise<Settings> {
  const stored = await get<Settings>(SETTINGS_KEY);
  return {
    anthropicKey: "",
    anthropicModel: "claude-opus-4-8",
    googleClientId: "",
    ...stored,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(SETTINGS_KEY, settings);
}
