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
import { Chat } from "../chat";
import { useGameStore } from "../state";
import { sendPacket } from "../packet";
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
import { StartingCountdown } from "./startingCountdown";
import { Disconnected } from "../disconnected";
import { BiddingEndCountdown } from "./biddingEndCountdown";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { VerificationCountdown } from "./verificationCountdown";
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
import { Winners } from "./winners";
import { WinnerCountdown } from "./winnerCountdown";
import { useIsMobile } from "~/lib/useIsMobile";
import { ChatButton } from "./chatButton";

export const Sidebar = () => {
  const authUser = useAuthUser();
  const {
    players,
    room,
    setLastReadChatsLength,
    lastReadChatsLength,
    chats,
    setRoom,
    setHighlightMovement,
    game,
  } = useGameStore();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const getPlayerFromPlayerId = (playerId: number): PlayerInfo => {
    return players!.find((e) => e.id === playerId)!;
  };
  const getPlayerFromPlayerIdStr = (playerIdStr: string): PlayerInfo => {
    const playerId = parseInt(playerIdStr.toString());
    return getPlayerFromPlayerId(playerId);
  };

  if (!room || !players || !game) return;
  return (
    <div className="divide-y-neutral-200 flex h-[100dvh] w-[320px] flex-col divide-y border-s border-s-neutral-200 bg-neutral-50">
      <h2 className="flex items-center justify-between p-4 text-lg font-semibold">
        Move Bidding
        {!isMobile && <ChatButton />}
      </h2>
      {room.targetTile &&
        ["nobid", "countdown", "verify"].includes(room.ingameState) && (
          <div
            className={cn("grid", {
              "grid-cols-2":
                room.movesTaken !== null && room.ingameState === "verify",
            })}
          >
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="text-xs text-neutral-600">The Target Is</div>
              <div className="flex size-12 gap-2">
                <Goal goalString={room.targetTile} />
              </div>
            </div>
            {room.movesTaken !== null && room.ingameState === "verify" && (
              <div className="flex flex-col items-center gap-2 p-4">
                <div className="text-xs text-neutral-600">Moves Taken</div>
                <div
                  className={cn(
                    "flex size-12 justify-center gap-2 text-5xl font-semibold",
                    {
                      "text-red-500":
                        room.movesTaken >
                        Object.entries(room.currentBids)
                          .filter((e) => e[1] !== null)
                          .sort((a, b) => compareBid(a[1], b[1]))[0]![1].bid,
                    },
                  )}
                >
                  {room.movesTaken}
                </div>
              </div>
            )}
          </div>
        )}
      {room.ingameState === "verify" &&
        room.currentVerifyingPlayerId === authUser!.id && (
          <div className="grid grid-cols-2 items-center gap-2 p-4">
            <Button
              variant={"destructive"}
              onClick={() => {
                setRoom((room) => ({
                  ...room!,
                  currentRockets: room!.restorableRockets,
                  movesTaken: 0,
                }));
                setHighlightMovement(undefined);
                sendPacket({
                  type: "playerVerifyReset",
                  sessionToken: authUser!.sessionToken,
                  gameId: game.id,
                } satisfies CtoSPlayerVerifyResetPacket);
              }}
            >
              Reset Moves
            </Button>
            <Button variant={"outline"}>Give Up</Button>
          </div>
        )}

      {room.ingameState === "countdown" && <BiddingEndCountdown />}
      {["countdown", "nobid"].includes(room.ingameState) && (
        <>
          <div className="flex flex-col items-center gap-[1px] p-4">
            <div className="text-xs text-neutral-600">Current Best</div>
            <Badge size={"lg"} variant={"secondary"}>
              {Object.keys(room.currentBids).length === 0
                ? "No bids"
                : `${Math.min(
                    ...Object.values(room.currentBids).map((e) => e.bid),
                  )} moves`}
            </Badge>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium">Quick Select</div>
              <div className="grid grid-cols-3 gap-1">
                {Array(12)
                  .fill(1)
                  .map((_, idx) => (
                    <Button
                      variant={selectedBid === idx + 1 ? "default" : "outline"}
                      key={`qs${idx}`}
                      onClick={() => setSelectedBid(idx + 1)}
                      disabled={
                        room.currentBids
                          ? idx + 1 >=
                            (room.currentBids[authUser!.id]?.bid ??
                              Number.MAX_VALUE)
                          : false
                      }
                    >
                      {idx + 1}
                    </Button>
                  ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium">Custom</div>
              <Input
                onChange={(e) => setSelectedBid(parseInt(e.target.value))}
                type="number"
                defaultValue={0}
              />
            </div>
            <Button
              disabled={!selectedBid}
              onClick={() => {
                if (!selectedBid) return;

                setSelectedBid(null);
                sendPacket({
                  type: "playerBid",
                  sessionToken: authUser!.sessionToken,
                  gameId: game.id,
                  data: {
                    bid: selectedBid,
                    time: currentTimeInSeconds(),
                  },
                } satisfies CtoSPlayerBidPacket);
              }}
            >
              {!selectedBid ? "Select Bid" : `Bid ${selectedBid}`}
            </Button>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <div className="text-xs font-medium">All Bids</div>
            <div className="flex flex-col gap-2">
              {Object.keys(room.currentBids).length === 0 ? (
                <Label>No bids</Label>
              ) : (
                ""
              )}
              {room.currentBids &&
                Object.entries(room.currentBids)
                  .sort((a, b) => compareBid(a[1], b[1]))
                  .map((bid, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <div>
                        {
                          players?.find(
                            (player) =>
                              player.id === parseInt(bid[0].toString()),
                          )?.username
                        }
                      </div>
                      <div
                        className={cn({
                          "text-neutral-600": idx !== 0,
                          "text-green-500": idx === 0,
                        })}
                      >
                        {bid[1].bid}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </>
      )}
      {room.ingameState === "verify" &&
        (() => {
          // playerId => bid
          const bids = Object.entries(room.currentBids)
            .filter((e) => e[1] !== null)
            .sort((a, b) => compareBid(a[1], b[1]));

          return (
            <>
              <div className="flex flex-col gap-2 p-4">
                <div className="text-xs font-medium">Verification Queue</div>
                <div className="flex flex-col gap-2">
                  <Card
                    className={
                      parseInt(bids[0]![0].toString()) === authUser!.id
                        ? "border-amber-200 bg-amber-100"
                        : ""
                    }
                  >
                    <CardTitle className="flex h-full justify-between px-4">
                      {parseInt(bids[0]![0].toString()) !== authUser!.id
                        ? `${getPlayerFromPlayerIdStr(bids[0]![0]).username}'s`
                        : "Your"}{" "}
                      Turn{" "}
                      <div className={"text-green-600"}>{bids[0]![1].bid}</div>
                    </CardTitle>
                  </Card>
                  {room.currentBids &&
                    bids.slice(1).map((playerBid, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1">
                            {parseInt(playerBid[0].toString()) ===
                              authUser!.id && (
                              <User className="size-3 stroke-amber-400" />
                            )}
                            {getPlayerFromPlayerIdStr(playerBid[0]).username}
                          </div>
                        </div>
                        <div className={"text-neutral-600"}>
                          {playerBid[1].bid}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <VerificationCountdown />
            </>
          );
        })()}
      <div className="flex flex-col gap-2 p-4">
        <div className="text-xs font-medium">Leaderboard</div>
        <div className="flex flex-col gap-2">
          {Object.keys(room.wins).length === 0 ? (
            <Label>No Winners Currently</Label>
          ) : (
            ""
          )}
          <Winners wins={room.wins} />
        </div>
      </div>
      <div className="flex h-full flex-col items-center gap-2 bg-neutral-200/50 p-4 text-center text-xs text-neutral-700">
        <div>
          Lowest bidder goes first and must complete in their bid no more, no
          less.
        </div>
        <div>You can{"'"}t bid higher than your current bid.</div>
        {false && (
          <>
            <Button
              onClick={() =>
                sendPacket({
                  type: "requestGameEnd",
                  sessionToken: authUser!.sessionToken,
                  gameId: game!.id,
                } satisfies CtoSRequestGameEndPacket)
              }
            >
              End
            </Button>
            {JSON.stringify(game)}
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(room!).filter((e) => e[0] !== "board"),
              ),
            )}
          </>
        )}
      </div>
    </div>
  );
};
