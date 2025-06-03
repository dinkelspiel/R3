import { create } from "zustand";
import type { GameState } from "~/server/db/schema";
import type {
  Chat,
  Game,
  GameRoom,
  StoCPlayerJoinResponse,
} from "~/shared/game";
import type { GridType, Rockets } from "~/shared/grid";

type ConnectionType =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

type GameStore = {
  connection: ConnectionType;
  setConnection: (connection: ConnectionType) => void;

  game: StoCPlayerJoinResponse["data"]["game"] | null;
  setGame: (cb: (state: GameStore["game"]) => GameStore["game"]) => void;

  players: StoCPlayerJoinResponse["data"]["players"] | null;
  setPlayers: (players: StoCPlayerJoinResponse["data"]["players"]) => void;

  socket: WebSocket | null;
  setSocket: (socket: WebSocket) => void;

  chats: Chat[];
  addChat: (chat: Chat) => void;
  lastReadChatsLength: number;
  setLastReadChatsLength: (lastReadChatsLength: number) => void;

  startingIn: number;
  setStartingIn: (startingIn: number) => void;

  room: GameRoom | null;
  setRoom: (cb: (state: GameRoom | null) => GameRoom | null) => void;

  forceUpdate: number;
  setForceUpdate: (startingIn: number) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  connection: "connecting",
  setConnection: (connection) => set({ connection }),

  game: null,
  setGame: (cb: (state: GameStore["game"]) => GameStore["game"]) =>
    set((state) => ({ game: cb(state.game) })),

  players: null,
  setPlayers: (players) => set({ players }),

  socket: null,
  setSocket: (socket) => set({ socket }),

  chats: [],
  addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),
  lastReadChatsLength: 0,
  setLastReadChatsLength: (lastReadChatsLength) => set({ lastReadChatsLength }),

  startingIn: 0,
  setStartingIn: (startingIn) => set({ startingIn }),

  room: null,
  setRoom: (cb: (state: GameRoom | null) => GameRoom | null) =>
    set((state) => ({ room: cb(state.room) })),

  forceUpdate: 0,
  setForceUpdate: (forceUpdate) => set({ forceUpdate }),
}));
