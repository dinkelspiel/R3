"use client";

import { useIsMounted, useWindowSize } from "usehooks-ts";
import { cn } from "~/lib/utils";
import { Wall } from "./wall";
import { Goal } from "./goal";
import type { GridType, N2, Rockets } from "~/shared/grid";
import { useEffect, useState } from "react";
import {
  calculateMovementSquares,
  getMovementSquaresDown,
  getMovementSquaresLeft,
  getMovementSquaresRight,
  getMovementSquaresUp,
} from "~/shared/movement";

const pairingFunction = (x: number, y: number): number => {
  return (x ** 2 + x + 2 * x * y + 3 * y + y ** 2) / 2;
};

export const Grid = ({
  onCellClick,
  grid,
  rockets,
  highlightMovement,
  className,
}: {
  onCellClick: (x: number, y: number) => void;
  grid: GridType;
  rockets: Rockets;
  highlightMovement?: N2;
  className?: string;
}) => {
  const { width = 0, height = 0 } = useWindowSize();
  const isMounted = useIsMounted();
  const isPortrait = isMounted() ? height + 320 > width : false;
  const [movementSquares, setMovementSquares] = useState<N2[]>([]);

  useEffect(() => {
    if (!highlightMovement) {
      setMovementSquares([]);
      return;
    }

    setMovementSquares(
      calculateMovementSquares(grid, rockets, highlightMovement),
    );
  }, [highlightMovement]);

  return (
    <div
      className={cn(
        "grid aspect-square grid-cols-[repeat(16,_minmax(0,_1fr))] grid-rows-[repeat(16,_minmax(0,_1fr))] rounded-[11px] border border-neutral-400 shadow-md",
        {
          "h-[calc(100vh-2rem)]": !isPortrait,
          "w-[95%]": isPortrait,
          className,
        },
      )}
    >
      {grid.map((gridY, y) =>
        gridY.map((gridX, x) => {
          return (
            <div
              className={cn(
                "relative size-full cursor-pointer border border-neutral-400 bg-neutral-200 break-all",
                {
                  "rounded-tl-lg": x === 0 && y === 0,
                  "rounded-bl-lg": x === 0 && y === grid.length - 1,
                  "rounded-tr-lg": x === gridY.length - 1 && y === 0,
                  "rounded-br-lg":
                    x === gridY.length - 1 && y === grid.length - 1,
                  "border border-neutral-600 bg-neutral-600 hover:bg-neutral-700":
                    [7, 8].includes(x) && [7, 8].includes(y),
                  "border-blue-400 bg-blue-200": movementSquares
                    ? movementSquares.find((p) => p.x === x && p.y === y)
                    : false,
                },
              )}
              onClick={() => onCellClick(x, y)}
              key={pairingFunction(x, y)}
            >
              {gridX.type !== "empty" && (
                <div className="absolute top-1/2 left-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2">
                  <Goal goalString={gridX.type} />
                </div>
              )}
              {gridX.wallY && (
                <div className="absolute z-10 flex h-full -scale-y-100 items-end">
                  <Wall className="translate-y-1/2+1px h-fit w-full rounded-[4px]" />
                </div>
              )}
              {gridX.wallX && (
                <div className="absolute z-10 flex h-full rotate-90 items-end">
                  <Wall className="translate-y-1/2+1px h-fit w-full rounded-[4px]" />
                </div>
              )}
              {rockets.red.x === x && rockets.red.y === y && (
                <div className="absolute top-1/2 left-1/2 z-20 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500"></div>
              )}
              {rockets.blue.x === x && rockets.blue.y === y && (
                <div className="absolute top-1/2 left-1/2 z-20 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500"></div>
              )}
              {rockets.yellow.x === x && rockets.yellow.y === y && (
                <div className="absolute top-1/2 left-1/2 z-20 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500"></div>
              )}
              {rockets.green.x === x && rockets.green.y === y && (
                <div className="absolute top-1/2 left-1/2 z-20 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500"></div>
              )}
              {rockets.silver.x === x && rockets.silver.y === y && (
                <div className="absolute top-1/2 left-1/2 z-20 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400"></div>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
};
