"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useAuthUser } from "~/app/_components/authUserProvider";
import {
  compareBid,
  type CtoSPlayerJoinPacket,
  type GameRoom,
  type StoCPacket,
} from "~/shared/game";
import { Connecting } from "./_components/connecting";
import { redirectError } from "./_components/error";
import { Game } from "./_components/game";
import { Lobby } from "./_components/lobby";
import { useGameStore } from "./_components/state";
import type { GameState } from "~/server/db/schema";
import { toast } from "sonner";
import { currentTimeInSeconds } from "~/lib/time";
import { getCompletedMove } from "~/shared/movement";
import { env } from "~/env";

export default function Home() {
  const {
    connection,
    setConnection,
    setGame,
    setPlayers,
    game,
    players,
    setSocket,
    addChat,
    setRoom,
    setStartingIn,
    setForceUpdate,
    setHighlightMovement,
  } = useGameStore();
  const params = useParams<{ gameCode: string }>();
  const authUser = useAuthUser();

  const RECONNECT_INTERVAL = 1500; // ms

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      setConnection("reconnecting");
      if (!process.env.NEXT_PUBLIC_WS_URL) {
        throw new Error("NEXT_PUBLIC_WS_URL is not defined");
      }
      socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

      socket.onopen = () => {
        setConnection("connected");
        setSocket(socket);
        socket.send(
          JSON.stringify({
            type: "playerJoin",
            sessionToken: authUser!.sessionToken,
            data: {
              gameCode: params.gameCode,
            },
          } satisfies CtoSPlayerJoinPacket),
        );
      };

      socket.onmessage = (event) => {
        const packet = JSON.parse(event.data as string) as StoCPacket;
        console.log("Recieved:", packet);

        let room = useGameStore.getState().room;
        switch (packet.type) {
          case "errorResponse":
            redirectError(packet.data.message);
            break;
          case "playerJoinResponse":
            setGame((_) => packet.data.game);
            setPlayers(packet.data.players);
            setRoom((_) => packet.data.room);
            break;
          case "playerJoinedEvent":
            if (!players) break;
            if (packet.data.id === authUser!.id) break;
            console.log("reached");
            setPlayers([...players, packet.data]);
            toast(`${packet.data.username} has joined the lobby.`);
            break;
          case "playerChatEvent":
            addChat(packet.data);
            break;
          case "gameStartEvent":
            console.log(game);
            setGame((game) => ({ ...game!, state: "ingame" }));
            setRoom((_) => packet.data.room);
            toast("When the countdown hits 0 the game board will be revaled.");

            setStartingIn(packet.data.startUnix - currentTimeInSeconds());
            break;
          case "gameEndEvent":
            setGame((game) => ({ ...game!, state: "lobby" }));
            break;
          case "gameRevealBoard":
            setRoom((_) => packet.data.room);
            toast("When you have found a route submit a bid in the sidebar.");
            break;
          case "playerBidEvent":
            if (packet.data.endUnix) {
              setStartingIn(packet.data.endUnix - currentTimeInSeconds());
              toast(
                `Player has made the first bid. You have ${packet.data.endUnix - currentTimeInSeconds()}s to submit a bid.`,
              );
            }

            setRoom((room) => ({
              ...room!,
              ingameState: "countdown",
              currentBids: Object.fromEntries([
                ...Object.entries(room!.currentBids ?? []).filter(
                  ([playerId]) =>
                    parseInt(playerId.toString()) !== packet.data.playerId,
                ),
                [packet.data.playerId, packet.data.bid],
              ]),
            }));
            break;
          case "gameStartVerification":
            setStartingIn(packet.data.endUnix - currentTimeInSeconds());
            setRoom((room) => ({
              ...room!,
              currentVerifyingPlayerId: packet.data.playerId,
              ingameState: "verify",
              movesTaken: 0,
            }));
            toast("Verification has started");
            break;
          case "playerVerifyMove":
            room = useGameStore.getState().room;
            if (room?.currentVerifyingPlayerId === authUser?.id) break;
            setRoom((room) => ({
              ...room!,
              currentRockets: {
                ...room!.currentRockets,
                [packet.data.rocket]: getCompletedMove(
                  room!.board,
                  room!.currentRockets,
                  packet.data.rocket,
                  packet.data.direction,
                ),
              },
              movesTaken: room!.movesTaken! + 1,
            }));
            break;
          case "playerVerifyReset":
            if (room?.currentVerifyingPlayerId === authUser?.id) break;
            setRoom((room) => ({
              ...room!,
              currentRockets: room!.restorableRockets,
              movesTaken: 0,
            }));
            break;
          case "playerVerifyCompleted":
            setRoom((room) => ({
              ...room!,
              wins: packet.data.wins,
              restorableRockets: { ...room!.currentRockets },
              ingameState: "winner",
            }));
            setStartingIn(packet.data.endUnix - currentTimeInSeconds());
            setHighlightMovement(undefined);
            break;
          case "gameVerifyNext":
            setRoom((room) => ({
              ...room!,
              currentBids: packet.data.newCurrentBids,
              currentRockets: { ...room!.restorableRockets },
              movesTaken: 0,
              currentVerifyingPlayerId: packet.data.newVerifyingPlayerId,
            }));
            console.log(
              "Starting in:",
              packet.data.endUnix - currentTimeInSeconds(),
            );
            setForceUpdate(currentTimeInSeconds());
            setStartingIn(packet.data.endUnix - currentTimeInSeconds());
            setHighlightMovement(undefined);
            break;
          case "gameVerifyFailed":
            setRoom((room) => ({
              ...room!,
              currentBids: {},
              currentRockets: { ...room!.restorableRockets },
              currentVerifyingPlayerId: null,
              movesTaken: 0,
              ingameState: "failed",
            }));
            setHighlightMovement(undefined);
            break;
          default:
            throw new Error(
              `Unimplemented message ${(packet as { type: string }).type}`,
            );
        }
      };

      socket.onclose = (event) => {
        console.warn(
          `WebSocket closed. Attempting to reconnect... '${event.reason}'`,
        );
        setConnection("disconnected");
        reconnectTimeout = setTimeout(connectWebSocket, RECONNECT_INTERVAL);
      };

      socket.onerror = (error) => {
        // console.error("WebSocket error:", error);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      socket?.close();
    };
  }, []);

  if (connection === "connecting" || !game) {
    return <Connecting />;
  }

  if (game.state === "lobby") {
    return <Lobby />;
  } else {
    return <Game />;
  }
}
