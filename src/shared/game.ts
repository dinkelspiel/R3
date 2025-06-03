import type { games, users } from "~/server/db/schema";
import type { GridType, Rocket, Rockets, Tiles, TilesNoEmpty } from "./grid";

type UserId = number;

export type Game = {
  name: string;
  password: string;
  ownerId: UserId;
  players: UserId[];
  grid: GridType;
};

export type CtoSBasePacket = {
  sessionToken: string;
  gameId: number;
};

export type CtoSPlayerJoinPacket = {
  type: "playerJoin";
  sessionToken: string;
  data: {
    gameCode: string;
  };
};

export type CtoSPlayerChatPacket = CtoSBasePacket & {
  type: "playerChat";
  data: {
    message: string;
  };
};

export type CtoSRequestGameStartPacket = CtoSBasePacket & {
  type: "requestGameStart";
};

export type CtoSRequestGameEndPacket = CtoSBasePacket & {
  type: "requestGameEnd";
};

export type CtoSPlayerBidPacket = CtoSBasePacket & {
  type: "playerBid";
  data: {
    bid: number;
    time: number;
  };
};

export type MoveDirection = "up" | "down" | "left" | "right";

export type CtoSPlayerVerifyMovePacket = CtoSBasePacket & {
  type: "playerVerifyMove";
  data: {
    rocket: Rocket;
    direction: MoveDirection;
  };
};

export type CtoSPlayerVerifyResetPacket = CtoSBasePacket & {
  type: "playerVerifyReset";
};

export type CtoSUpdateSettingsPacket = CtoSBasePacket & {
  type: "updateSettings";
  data: Settings;
};

export type CtoSPacket =
  | CtoSPlayerJoinPacket
  | CtoSRequestGameStartPacket
  | CtoSRequestGameEndPacket
  | CtoSPlayerChatPacket
  | CtoSPlayerBidPacket
  | CtoSPlayerVerifyMovePacket
  | CtoSPlayerVerifyResetPacket
  | CtoSUpdateSettingsPacket;

export type PlayerInfo = {
  id: number;
  username: string;
};

export type GameInfo = {
  id: number;
  name: string;
  state: (typeof games.$inferSelect)["state"];
  ownerId: number;
};

export type Bid = {
  bid: number;
  time: number;
};

export const compareBid = (a: Bid, b: Bid) => {
  if (a.bid === b.bid) {
    return a.time - b.time;
  }

  return a.bid - b.bid;
};

export type Settings = {
  startingDelay: number;
  verificationTime: number;
  biddingCountdownTime: number;
};

export type GameRoom = {
  ingameState:
    | "starting"
    | "nobid"
    | "countdown"
    | "verify"
    | "winner"
    | "failed";
  board: GridType;
  restorableRockets: Rockets;
  currentRockets: Rockets;
  currentBids: Record<number, Bid>; // playerId => bid
  currentVerifyingPlayerId: number | null;
  targetTile: TilesNoEmpty | null;
  movesTaken: number | null;
  wins: Record<number, TilesNoEmpty[]>;
  usedTiles: TilesNoEmpty[];
  settings: Settings;
};

export type StoCPlayerJoinResponse = {
  type: "playerJoinResponse";
  data: {
    game: GameInfo;
    players: PlayerInfo[];
    room: GameRoom;
  };
};

export type StoCErrorResponse = {
  type: "errorResponse";
  data: {
    message: string;
  };
};

export type StoCResponsePacket = StoCPlayerJoinResponse | StoCErrorResponse;

export type StoCPlayerJoinEvent = {
  type: "playerJoinedEvent";
  data: PlayerInfo;
};

export type Chat = {
  playerId: number;
  message: string;
};

export type StoCPlayerChatEvent = {
  type: "playerChatEvent";
  data: Chat;
};

export type StoCGameStartEvent = {
  type: "gameStartEvent";
  data: {
    startUnix: number;
    room: GameRoom;
  };
};

export type StoCGamEndEvent = {
  type: "gameEndEvent";
};

export type StoCGameRevealBoardEvent = {
  type: "gameRevealBoard";
  data: {
    room: GameRoom;
  };
};

export type StoCPlayerBidEvent = {
  type: "playerBidEvent";
  data: {
    playerId: number;
    bid: Bid;
    endUnix: number | null;
  };
};

export type StoCGameStartVerificationEvent = {
  type: "gameStartVerification";
  data: {
    playerId: number;
    endUnix: number;
  };
};

export type StoCPlayerVerifyMoveEvent = {
  type: "playerVerifyMove";
  data: {
    rocket: Rocket;
    direction: MoveDirection;
  };
};

export type StoCPlayerVerifyResetEvent = {
  type: "playerVerifyReset";
};

export type StoCPlayerVerifyCompletedEvent = {
  type: "playerVerifyCompleted";
  data: {
    wins: Record<number, TilesNoEmpty[]>;
    endUnix: number;
  };
};

export type StoCGameVerifyNextEvent = {
  type: "gameVerifyNext";
  data: {
    newCurrentBids: Record<number, Bid>;
    newVerifyingPlayerId: number;
    endUnix: number;
  };
};

export type StoCGameVerifyFailedEvent = {
  type: "gameVerifyFailed";
};

export type StoCGameCompletedEvent = {
  type: "gameCompleted";
};

export type StoCEventPacket =
  | StoCPlayerJoinEvent
  | StoCPlayerChatEvent
  | StoCGameStartEvent
  | StoCGamEndEvent
  | StoCGameRevealBoardEvent
  | StoCPlayerBidEvent
  | StoCGameStartVerificationEvent
  | StoCPlayerVerifyMoveEvent
  | StoCPlayerVerifyResetEvent
  | StoCPlayerVerifyCompletedEvent
  | StoCGameVerifyNextEvent
  | StoCGameVerifyFailedEvent
  | StoCGameCompletedEvent;

export type StoCPacket = StoCEventPacket | StoCResponsePacket;
