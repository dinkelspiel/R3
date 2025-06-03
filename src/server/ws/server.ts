import "dotenv/config";
import { WebSocketServer } from "ws";
import {
  tilesNoEmpty,
  type GridType,
  type N2,
  type Rockets,
  type TilesNoEmpty,
} from "../../shared/grid";
import {
  compareBid,
  type CtoSPacket,
  type CtoSPlayerBidPacket,
  type CtoSPlayerChatPacket,
  type CtoSPlayerJoinPacket,
  type CtoSPlayerVerifyMovePacket,
  type CtoSPlayerVerifyResetPacket,
  type CtoSRequestGameEndPacket,
  type CtoSRequestGameStartPacket,
  type GameInfo,
  type GameRoom,
  type StoCEventPacket,
  type StoCGamEndEvent,
  type StoCGameRevealBoardEvent,
  type StoCGameStartEvent,
  type StoCGameStartVerificationEvent,
  type StoCGameVerifyFailedEvent,
  type StoCGameVerifyNextEvent,
  type StoCPacket,
  type StoCPlayerBidEvent,
  type StoCPlayerChatEvent,
  type StoCPlayerJoinEvent,
  type StoCPlayerJoinResponse,
  type StoCPlayerVerifyCompletedEvent,
  type StoCPlayerVerifyMoveEvent,
  type StoCPlayerVerifyResetEvent,
  type StoCResponsePacket,
} from "~/shared/game";
import { db } from "../db";
import type WebSocket from "ws";
import { games, gameUsers, users } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { validateSessionToken } from "../auth/validate";
import { defaultGrid } from "~/app/_components/defaultGrid";
import { currentTimeInSeconds } from "~/lib/time";
import {
  getCompletedMove,
  getMovementSquaresDown,
  getMovementSquaresLeft,
  getMovementSquaresRight,
  getMovementSquaresUp,
} from "~/shared/movement";

const wss = new WebSocketServer({ port: 3001 });

// gameId => WebSocket[]
const gamePlayers = new Map<number, Set<WebSocket>>();

// gameId => non-persistent gamedata
const gameRooms = new Map<number, GameRoom>();

const broadcastToRoom = (
  ws: WebSocket,
  gameId: number,
  packet: StoCEventPacket,
) => {
  if (!gamePlayers.has(gameId)) {
    return;
  }

  console.log(`Broadcasting: ${JSON.stringify(packet)}`);
  gamePlayers.get(gameId)?.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(packet));
    }
  });
};

wss.on("connection", (ws) => {
  ws.on("message", (message: string) => {
    void (async () => {
      try {
        console.log("Received:", message.toString());
        const data = JSON.parse(message.toString()) as CtoSPacket;

        let response: StoCResponsePacket | null = err("No response");
        switch (data.type) {
          case "playerJoin":
            response = await handlePlayerJoinPacket(ws, data);
            break;
          case "requestGameStart":
            response = await handleRequestGameStartPacket(ws, data);
            break;
          case "requestGameEnd":
            response = await handleRequestGameEndPacket(ws, data);
            break;
          case "playerChat":
            response = await handlePlayerChatPacket(ws, data);
            break;
          case "playerBid":
            response = await handlePlayerBidPacket(ws, data);
            break;
          case "playerVerifyMove":
            response = await handlePlayerVerifyMovePacket(ws, data);
            break;
          case "playerVerifyReset":
            response = await handlePlayerVerifyResetPacket(ws, data);
            break;
          default:
            console.log(
              `Unimplemented message ${(data as { type: string }).type}`,
            );
        }

        if (response != null) {
          if ("gameId" in data) {
            if (gameRooms.has(data.gameId)) {
              console.log(
                "Rockets: ",
                gameRooms.get(data.gameId)!.currentRockets,
              );
            }
          }
          console.log("Sent:", JSON.stringify(response));
          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    })();
  });
});

const err = (message: string): StoCResponsePacket => {
  return {
    type: "errorResponse",
    data: {
      message,
    },
  };
};

const handlePlayerJoinPacket = async (
  ws: WebSocket,
  packet: CtoSPlayerJoinPacket,
): Promise<StoCResponsePacket> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  const game = (
    await db.select().from(games).where(eq(games.code, packet.data.gameCode))
  )[0];
  if (!game) {
    return err("No game found with code");
  }

  // Add connection to a set of connections for the specific game room for broadcasts etc.
  if (!gamePlayers.has(game.id)) {
    gamePlayers.set(game.id, new Set());
  }
  gamePlayers.get(game.id)?.add(ws);

  // Add player to persistent database of players in game if they aren't there already
  const existingPlayer = (
    await db
      .select()
      .from(gameUsers)
      .where(
        and(eq(gameUsers.gameId, game.id), eq(gameUsers.userId, authUser.id)),
      )
  )[0];
  if (!existingPlayer) {
    await db.insert(gameUsers).values({
      gameId: game.id,
      userId: authUser.id,
    });

    // Send that a new player has joined to all connected clients
    broadcastToRoom(ws, game.id, {
      type: "playerJoinedEvent",
      data: {
        id: authUser.id,
        username: authUser.username,
      },
    } satisfies StoCPlayerJoinEvent);
  }
  const players = await db
    .select()
    .from(gameUsers)
    .where(eq(gameUsers.gameId, game.id))
    .leftJoin(users, eq(users.id, gameUsers.userId));

  const gameRoom = gameRooms.get(game.id);

  return {
    type: "playerJoinResponse",
    data: {
      game: {
        id: game.id,
        name: game.name,
        ownerId: game.ownerId,
        state: game.state,
      },
      players: players
        .map((players) => players.users)
        .map((user) => ({
          id: user!.id,
          username: user!.username,
        })),
      room: game.state === "ingame" && gameRoom ? gameRoom : null,
    },
  } satisfies StoCPlayerJoinResponse;
};

const generateRandomPositionInBounds = (board: GridType): N2 => {
  const x = Math.floor(Math.random() * board[0]!.length);
  const y = Math.floor(Math.random() * board.length);

  return {
    x,
    y,
  } satisfies N2;
};

const generateRockets = (board: GridType): Rockets => {
  const rocketIds = ["red", "green", "blue", "yellow", "silver"];
  const rocketPositions: Record<string, N2> = {};

  while (Object.keys(rocketPositions).length !== rocketIds.length) {
    const position = generateRandomPositionInBounds(board);
    if (board[position.y]![position.x]!.type !== "empty") {
      continue;
    }

    if (
      Object.values(rocketPositions).find(
        (pos) => pos.x === position.x && pos.y === position.y,
      )
    ) {
      continue;
    }

    if ([7, 8].includes(position.x) && [7, 8].includes(position.y)) {
      continue;
    }

    const rocketId = rocketIds[Object.keys(rocketPositions).length]!;
    rocketPositions[rocketId] = position;
  }

  console.log(rocketPositions);
  return rocketPositions as Rockets;
};

const getRandomTile = () =>
  tilesNoEmpty[Math.floor(Math.random() * tilesNoEmpty.length)]!;

const startGame = (ws: WebSocket, game: GameInfo) => {
  const startingDelay = 20;

  broadcastToRoom(ws, game.id, {
    type: "gameStartEvent",
    data: {
      startUnix: currentTimeInSeconds() + startingDelay, // Start game after startingDelay seconds
      room: gameRooms.get(game.id)!,
    },
  } satisfies StoCGameStartEvent);

  setTimeout(() => {
    (async () => {
      const targetTile = getRandomTile();

      const room = gameRooms.get(game.id);
      if (!room) return;

      room.ingameState = "nobid";
      room.targetTile = targetTile;
      room.currentBids = {};
      room.currentRockets = room.restorableRockets;
      room.currentVerifyingPlayerId = null;
      gameRooms.set(game.id, room);

      broadcastToRoom(ws, game.id, {
        type: "gameRevealBoard",
        data: {
          room,
        },
      } satisfies StoCGameRevealBoardEvent);
    })();
  }, startingDelay * 1000);
};

const handleRequestGameStartPacket = async (
  ws: WebSocket,
  packet: CtoSRequestGameStartPacket,
): Promise<StoCResponsePacket | null> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  const game = (
    await db.select().from(games).where(eq(games.id, packet.gameId))
  )[0];
  if (!game) {
    return err("No game found with id");
  }

  if (authUser.id !== game.ownerId) {
    return err("You are not the owner");
  }

  await db
    .update(games)
    .set({
      state: "ingame",
    })
    .where(eq(games.id, packet.gameId));

  const board = defaultGrid;
  const rockets = generateRockets(board);

  if (!gameRooms.has(game.id)) {
    gameRooms.set(game.id, {
      board,
      restorableRockets: rockets,
      currentRockets: rockets,
      currentBids: {},
      ingameState: "starting",
      currentVerifyingPlayerId: null,
      targetTile: null,
      movesTaken: null,
      wins: {},
    });
  }

  startGame(ws, game);

  return null;
};

const handleRequestGameEndPacket = async (
  ws: WebSocket,
  packet: CtoSRequestGameEndPacket,
): Promise<StoCResponsePacket | null> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  console.log(packet);
  const game = (
    await db.select().from(games).where(eq(games.id, packet.gameId))
  )[0];
  if (!game) {
    return err("No game found with id");
  }

  if (authUser.id !== game.ownerId) {
    return err("You are not the owner");
  }

  await db
    .update(games)
    .set({
      state: "lobby",
    })
    .where(eq(games.id, packet.gameId));

  gameRooms.delete(game.id);

  broadcastToRoom(ws, game.id, {
    type: "gameEndEvent",
  } satisfies StoCGamEndEvent);

  return null;
};

const handlePlayerChatPacket = async (
  ws: WebSocket,
  packet: CtoSPlayerChatPacket,
): Promise<StoCResponsePacket | null> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  const game = (
    await db.select().from(games).where(eq(games.id, packet.gameId))
  )[0];
  if (!game) {
    return err("No game found with code");
  }

  broadcastToRoom(ws, game.id, {
    type: "playerChatEvent",
    data: {
      playerId: authUser.id,
      message: packet.data.message,
    },
  } satisfies StoCPlayerChatEvent);

  return null;
};

const handleVerifyNext = (ws: WebSocket, endDelay: number, game: GameInfo) => {
  const room = gameRooms.get(game.id);
  if (room?.ingameState !== "verify") {
    return;
  }

  console.log("Reached", Object.entries(room.currentBids).length);
  if (Object.entries(room.currentBids).length === 1) {
    room.ingameState = "failed";
    room.currentBids = {};
    room.currentRockets = room.restorableRockets;
    room.currentVerifyingPlayerId = null;
    room.movesTaken = 0;
    gameRooms.set(game.id, room);

    broadcastToRoom(ws, game.id, {
      type: "gameVerifyFailed",
    } satisfies StoCGameVerifyFailedEvent);

    setTimeout(() => {
      startGame(ws, game);
    }, endDelay * 1000);
    return;
  }

  const sortedBidEntries = Object.entries(room.currentBids).sort((a, b) =>
    compareBid(a[1], b[1]),
  );
  const currentBidsWithoutCurrentVerifier = Object.fromEntries(
    sortedBidEntries.filter(
      (e) => e[0] !== room.currentVerifyingPlayerId!.toString(),
    ),
  );

  const newCurrentBids = currentBidsWithoutCurrentVerifier;
  const newVerifyingPlayerId = parseInt(
    Object.entries(currentBidsWithoutCurrentVerifier)
      .sort((a, b) => compareBid(a[1], b[1]))[0]![0]
      .toString(),
  );

  room.currentBids = newCurrentBids;
  room.currentVerifyingPlayerId = newVerifyingPlayerId;
  gameRooms.set(game.id, room);

  broadcastToRoom(ws, game.id, {
    type: "gameVerifyNext",
    data: {
      newCurrentBids,
      newVerifyingPlayerId,
      endUnix: currentTimeInSeconds() + endDelay,
    },
  } satisfies StoCGameVerifyNextEvent);

  setTimeout(() => {
    handleVerifyNext(ws, endDelay, game);
  }, endDelay * 1000);
};

const handlePlayerBidPacket = async (
  ws: WebSocket,
  packet: CtoSPlayerBidPacket,
): Promise<StoCResponsePacket | null> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  const game = (
    await db.select().from(games).where(eq(games.id, packet.gameId))
  )[0];
  if (!game) {
    return err("No game found with id");
  }

  if (game.state !== "ingame") {
    return err("Gamestate isn't ingame");
  }

  const gameRoom = gameRooms.get(game.id);
  if (!gameRoom) {
    throw new Error("No game room");
  }

  if (!["nobid", "countdown"].includes(gameRoom.ingameState)) {
    return err(`Can't bid while ingameState is ${gameRoom.ingameState}`);
  }

  let updatedBid = false;
  if (!Object.keys(gameRoom.currentBids).includes(authUser.id.toString())) {
    gameRoom.currentBids[authUser.id] = packet.data;
    updatedBid = true;
  } else {
    const currentBid = gameRoom.currentBids[authUser.id];
    if (packet.data.bid < currentBid!.bid) {
      gameRoom.currentBids[authUser.id] = packet.data;
      updatedBid = true;
    }
  }

  let startedCountdown = false;
  const endDelay = 60;

  if (gameRoom.ingameState !== "countdown") {
    gameRoom.ingameState = "countdown";
    startedCountdown = true;

    setTimeout(() => {
      (async () => {
        const room = gameRooms.get(game.id);

        const verifyingPlayerId = parseInt(
          Object.entries(room!.currentBids)
            .sort((a, b) => compareBid(a[1], b[1]))[0]![0]
            .toString(),
        );

        room!.ingameState = "verify";
        room!.currentVerifyingPlayerId = verifyingPlayerId;
        gameRooms.set(game.id, room!);

        const endDelay = 60;

        broadcastToRoom(ws, packet.gameId, {
          type: "gameStartVerification",
          data: {
            playerId: verifyingPlayerId,
            endUnix: currentTimeInSeconds() + endDelay,
          },
        } satisfies StoCGameStartVerificationEvent);

        setTimeout(() => {
          handleVerifyNext(ws, endDelay, game);
        }, endDelay * 1000);
      })();
    }, endDelay * 1000); // setTimeout works in ms not seconds so i *1000
  }

  if (updatedBid) {
    gameRooms.set(game.id, gameRoom);
    broadcastToRoom(ws, game.id, {
      type: "playerBidEvent",
      data: {
        playerId: authUser.id,
        bid: packet.data,
        endUnix: startedCountdown ? currentTimeInSeconds() + endDelay : null,
      },
    } satisfies StoCPlayerBidEvent);
  }

  return null;
};

const getTileColor = (tile: TilesNoEmpty): string => {
  return tile.split("_")[0]!;
};

const isBoardWon = (
  board: GridType,
  rockets: Rockets,
  targetTile: TilesNoEmpty,
) => {
  let targetTilePosition: N2 | null = null;

  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell.type === targetTile) {
        targetTilePosition = {
          x,
          y,
        };
      }
    }),
  );

  if (targetTilePosition === null) {
    throw new Error("Target tile was not found on board");
  }

  const rocketOnGoal = Object.entries(rockets).find(
    (rocket) =>
      rocket[1].x === targetTilePosition!.x &&
      rocket[1].y === targetTilePosition!.y,
  );

  if (!rocketOnGoal) return false;

  const goalColor = getTileColor(targetTile);

  return goalColor === rocketOnGoal[0] || goalColor === "joker";
};

const handlePlayerVerifyMovePacket = async (
  ws: WebSocket,
  packet: CtoSPlayerVerifyMovePacket,
): Promise<StoCResponsePacket | null> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  const game = (
    await db.select().from(games).where(eq(games.id, packet.gameId))
  )[0];
  if (!game) {
    return err("No game found with id");
  }

  if (game.state !== "ingame") {
    return err("Gamestate isn't ingame");
  }

  const gameRoom = gameRooms.get(game.id);
  if (!gameRoom) {
    throw new Error("No game room");
  }

  if (gameRoom.ingameState !== "verify") {
    return err(`Can't bid while ingameState isn't verify`);
  }

  if (gameRoom.currentVerifyingPlayerId !== authUser.id) {
    return err("You are not the current verifying player");
  }

  const movedTo = getCompletedMove(
    gameRoom.board,
    gameRoom.currentRockets,
    packet.data.rocket,
    packet.data.direction,
  );

  console.log("MovedTo:", movedTo);
  gameRoom.currentRockets[packet.data.rocket] = movedTo;
  gameRoom.movesTaken = gameRoom.movesTaken ? gameRoom.movesTaken + 1 : 1;
  gameRooms.set(game.id, gameRoom);

  broadcastToRoom(ws, game.id, {
    type: "playerVerifyMove",
    data: packet.data,
  } satisfies StoCPlayerVerifyMoveEvent);

  const bid = gameRoom.currentBids[gameRoom.currentVerifyingPlayerId]?.bid;

  console.log(
    "Room:",
    Object.fromEntries(
      Object.entries(gameRoom).filter(([a, b]) => a !== "board"),
    ),
  );

  if (
    gameRoom.movesTaken === bid &&
    isBoardWon(gameRoom.board, gameRoom.currentRockets, gameRoom.targetTile!)
  ) {
    const { wins = {}, targetTile } = gameRoom;
    const playerId = gameRoom.currentVerifyingPlayerId;

    const playerWins = wins[playerId] ?? [];
    const updatedWins = {
      ...wins,
      [playerId]: [...playerWins, targetTile!],
    };

    gameRoom.movesTaken = 0;
    gameRoom.currentBids = {};
    gameRoom.wins = updatedWins;
    gameRoom.ingameState = "winner";
    gameRooms.set(game.id, gameRoom);

    const endDelay = 10;

    broadcastToRoom(ws, game.id, {
      type: "playerVerifyCompleted",
      data: {
        wins: updatedWins,
        endUnix: currentTimeInSeconds() + endDelay,
      },
    } satisfies StoCPlayerVerifyCompletedEvent);

    setTimeout(() => {
      startGame(ws, game);
    }, endDelay * 1000);
  }

  return null;
};

const handlePlayerVerifyResetPacket = async (
  ws: WebSocket,
  packet: CtoSPlayerVerifyResetPacket,
): Promise<StoCResponsePacket | null> => {
  const authUser = await validateSessionToken(packet.sessionToken);
  if (!authUser) {
    return err("You are not logged in");
  }

  // Check if game exists
  const game = (
    await db.select().from(games).where(eq(games.id, packet.gameId))
  )[0];
  if (!game) {
    return err("No game found with id");
  }

  if (game.state !== "ingame") {
    return err("Gamestate isn't ingame");
  }

  const gameRoom = gameRooms.get(game.id);
  if (!gameRoom) {
    throw new Error("No game room");
  }

  if (gameRoom.ingameState !== "verify") {
    return err(`Can't bid while ingameState isn't verify`);
  }

  if (gameRoom.currentVerifyingPlayerId !== authUser.id) {
    return err("You are not the current verifying player");
  }

  gameRoom.movesTaken = 0;
  gameRoom.currentRockets = gameRoom.restorableRockets;
  gameRooms.set(game.id, gameRoom);

  broadcastToRoom(ws, game.id, {
    type: "playerVerifyReset",
  } satisfies StoCPlayerVerifyResetEvent);

  return null;
};
