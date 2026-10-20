import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as typeof globalThis & {
  __ghostLiveblocksClient?: Liveblocks;
};

const cursorPalette = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#2DD4BF",
  "#F59E0B",
  "#38BDF8",
];

export function getUserCursorColor(userId: string) {
  const hash = Array.from(userId).reduce((total, character) => {
    return total + character.charCodeAt(0);
  }, 0);

  return cursorPalette[hash % cursorPalette.length];
}

export function getLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required for Liveblocks room authentication.");
  }

  if (!globalForLiveblocks.__ghostLiveblocksClient) {
    globalForLiveblocks.__ghostLiveblocksClient = new Liveblocks({ secret });
  }

  return globalForLiveblocks.__ghostLiveblocksClient;
}
