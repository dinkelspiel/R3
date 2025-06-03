import type { TilesNoEmpty } from "~/shared/grid";
import { useGameStore } from "../state";
import type { PlayerInfo } from "~/shared/game";
import { Goal } from "~/app/_components/goal";

export const Winners = ({ wins }: { wins: Record<number, TilesNoEmpty[]> }) => {
  const { players } = useGameStore();

  const getPlayerFromPlayerId = (playerId: number): PlayerInfo => {
    return players!.find((e) => e.id === playerId)!;
  };
  const getPlayerFromPlayerIdStr = (playerIdStr: string): PlayerInfo => {
    const playerId = parseInt(playerIdStr.toString());
    return getPlayerFromPlayerId(playerId);
  };

  return Object.entries(wins)
    .sort((a, b) => a[1].length - b[1].length)
    .map((win, idx) => (
      <div key={win[0]}>
        <div className="flex gap-2">
          <div>{idx + 1}.</div>
          <div>{getPlayerFromPlayerIdStr(win[0]).username}</div>
        </div>
        <div className="flex gap-2">
          {win[1].map((win) => (
            <div key={win} className="size-6">
              <Goal goalString={win} />
            </div>
          ))}
        </div>
      </div>
    ));
};
