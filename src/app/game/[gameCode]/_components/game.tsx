import { Currency, MessageCircle, User } from "lucide-react";
import { useRef, useState } from "react";
import { defaultGrid } from "~/app/_components/defaultGrid";
import { Grid } from "~/app/_components/grid";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { Chat } from "./chat";
import { useGameStore } from "./state";
import { sendPacket } from "./packet";
import {
  compareBid,
  type CtoSPlayerBidPacket,
  type CtoSPlayerVerifyMovePacket,
  type CtoSPlayerVerifyResetPacket,
  type CtoSRequestGameEndPacket,
  type MoveDirection,
  type PlayerInfo,
} from "~/shared/game";
import { useAuthUser } from "~/app/_components/authUserProvider";
import { Label } from "~/components/ui/label";
import { StartingCountdown } from "./game/startingCountdown";
import { Disconnected } from "./disconnected";
import { BiddingEndCountdown } from "./game/biddingEndCountdown";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { VerificationCountdown } from "./game/verificationCountdown";
import type { N2, Rocket } from "~/shared/grid";
import { currentTimeInSeconds } from "~/lib/time";
import {
  calculateMovementSquares,
  getCompletedMove,
  getMovementSquaresDown,
  getMovementSquaresLeft,
  getMovementSquaresRight,
  getMovementSquaresUp,
} from "~/shared/movement";
import { Goal } from "~/app/_components/goal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Winners } from "./game/winners";
import { WinnerCountdown } from "./game/winnerCountdown";
import { Sidebar } from "./game/sidebar";
import { useIsMounted, useWindowSize } from "usehooks-ts";
import { useIsMobile } from "~/lib/useIsMobile";
import { ChatButton } from "./game/chatButton";

export const Game = () => {
  const {
    game,
    room,
    setRoom,
    players,
    chats,
    lastReadChatsLength,
    setLastReadChatsLength,
    connection,
    highlightMovement,
    setHighlightMovement,
  } = useGameStore();
  if (!game) throw Error("Unreachable");

  const authUser = useAuthUser();

  const isMobile = useIsMobile();

  if (!room) {
    if (game.ownerId === authUser!.id) {
      sendPacket({
        type: "requestGameEnd",
        sessionToken: authUser!.sessionToken,
        gameId: game.id,
      } satisfies CtoSRequestGameEndPacket);
    }
    return;
  }
  const getPlayerFromPlayerId = (playerId: number): PlayerInfo => {
    return players!.find((e) => e.id === playerId)!;
  };

  return (
    <div className="grid lg:grid-cols-[1fr_max-content]">
      <main className="flex h-screen flex-col items-center justify-center gap-2 bg-neutral-100">
        {connection !== "connected" && <Disconnected />}
        <Dialog open={["winner", "failed"].includes(room.ingameState)}>
          <DialogContent className="[&>button]:hidden">
            <DialogHeader>
              {room.currentVerifyingPlayerId &&
                room.ingameState === "winner" && (
                  <DialogTitle>
                    {
                      getPlayerFromPlayerId(room.currentVerifyingPlayerId)
                        .username
                    }{" "}
                    Won This Round!
                  </DialogTitle>
                )}
              {room.ingameState === "failed" && (
                <DialogTitle>No one completed this round.</DialogTitle>
              )}
            </DialogHeader>
            {["winner", "failed"].includes(room.ingameState) && (
              <WinnerCountdown />
            )}
            <Winners wins={room.wins} />
          </DialogContent>
        </Dialog>

        {["countdown", "nobid", "verify", "winner", "failed"].includes(
          room.ingameState,
        ) &&
          room.board && (
            <Grid
              grid={room.board}
              highlightMovement={highlightMovement}
              onCellClick={(x, y) => {
                if (room.ingameState !== "verify") return;
                if (
                  !Object.values(room.currentRockets).find(
                    (p) => p.x === x && p.y === y,
                  )
                ) {
                  if (!highlightMovement) return;
                  let direction: MoveDirection | null = null;
                  if (
                    getMovementSquaresUp(
                      room.board,
                      room.currentRockets,
                      highlightMovement,
                    ).find((p) => p.x === x && p.y === y)
                  ) {
                    direction = "up";
                  } else if (
                    getMovementSquaresDown(
                      room.board,
                      room.currentRockets,
                      highlightMovement,
                    ).find((p) => p.x === x && p.y === y)
                  ) {
                    direction = "down";
                  } else if (
                    getMovementSquaresLeft(
                      room.board,
                      room.currentRockets,
                      highlightMovement,
                    ).find((p) => p.x === x && p.y === y)
                  ) {
                    direction = "left";
                  } else if (
                    getMovementSquaresRight(
                      room.board,
                      room.currentRockets,
                      highlightMovement,
                    ).find((p) => p.x === x && p.y === y)
                  ) {
                    direction = "right";
                  }

                  if (direction === null) return;

                  const rocket = Object.entries(room.currentRockets).find(
                    (e) =>
                      e[1].x === highlightMovement.x &&
                      e[1].y === highlightMovement.y,
                  )![0] as Rocket;

                  const movedTo = getCompletedMove(
                    room.board,
                    room.currentRockets,
                    rocket,
                    direction,
                  );

                  setHighlightMovement(movedTo);

                  setRoom((room) => ({
                    ...room!,
                    currentRockets: {
                      ...room!.currentRockets,
                      [rocket]: movedTo,
                    },
                    movesTaken: room!.movesTaken ? room!.movesTaken + 1 : 1,
                  }));

                  sendPacket({
                    type: "playerVerifyMove",
                    sessionToken: authUser!.sessionToken,
                    gameId: game.id,
                    data: {
                      direction,
                      rocket,
                    },
                  } satisfies CtoSPlayerVerifyMovePacket);

                  return;
                }
                if (room.currentVerifyingPlayerId! !== authUser!.id) return;

                setHighlightMovement({ x, y });
                return;
              }}
              rockets={room.currentRockets}
            />
          )}
        {room.ingameState === "starting" && <StartingCountdown />}
      </main>
      <div
        className={cn("absolute top-2 right-2 flex items-center gap-2", {
          hidden: !isMobile,
        })}
      >
        {room.targetTile &&
          ["nobid", "countdown", "verify"].includes(room.ingameState) && (
            <div className="size-8">
              <Goal goalString={room.targetTile} />
            </div>
          )}
        {isMobile && <ChatButton />}
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open Sidebar</Button>
          </PopoverTrigger>
          <PopoverContent className="me-2 w-fit overflow-clip rounded-lg p-0">
            {isMobile && <Sidebar />}
          </PopoverContent>
        </Popover>
      </div>

      {!isMobile && <Sidebar />}
    </div>
  );
};
