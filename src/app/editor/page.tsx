"use client";

import { useState } from "react";
import { Grid } from "../_components/grid";
import { cn } from "~/lib/utils";
import { defaultGrid } from "../_components/defaultGrid";
import type { GridType, Tiles } from "~/shared/grid";

const colors = ["green", "blue", "red", "yellow"];
const icons = ["cog", "moon", "planet", "star"];

const getColorIcons = () => {
  const arr: string[] = [];
  arr.push("empty");
  arr.push("joker");
  colors.map((color) =>
    icons.map((icon) => {
      arr.push(`${color}_${icon}`);
    }),
  );
  return arr;
};

export default function Page() {
  const [grid, setGrid] = useState<GridType>(defaultGrid);
  const [mode, setMode] = useState<"wall" | Tiles>("wall");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4">
      <div className="flex gap-4">
        <Grid
          rockets={{
            red: { x: 0, y: 0 },
            green: { x: 0, y: 0 },
            yellow: { x: 0, y: 0 },
            blue: { x: 0, y: 0 },
            silver: { x: 0, y: 0 },
          }}
          onCellClick={(clickX, clickY) => {
            setGrid(
              grid.map((gridY, y) => {
                if (y !== clickY) {
                  return gridY;
                }

                return gridY.map((gridX, x) => {
                  if (x !== clickX || y !== clickY) {
                    return gridX;
                  }

                  const newCell = { ...gridX };
                  if (mode !== "wall") {
                    newCell.type = mode;
                    return newCell;
                  }

                  if (!newCell.wallX && !newCell.wallY) {
                    newCell.wallX = true;
                  } else if (newCell.wallX && !newCell.wallY) {
                    newCell.wallX = false;
                    newCell.wallY = true;
                  } else if (!newCell.wallX && newCell.wallY) {
                    newCell.wallX = true;
                    newCell.wallY = true;
                  } else {
                    newCell.wallX = false;
                    newCell.wallY = false;
                  }
                  return newCell;
                });
              }),
            );
          }}
          grid={grid}
        />
        <div className="flex flex-col gap-2">
          {["wall", ...getColorIcons()].map((item) => (
            <div
              key={item}
              className={cn(
                "cursor-pointer rounded-lg border-2 border-blue-400 bg-blue-100 p-2 hover:bg-blue-200",
                {
                  "border-neutral-200 bg-neutral-100 hover:bg-neutral-200":
                    item !== mode,
                },
              )}
              onClick={() => setMode(item as Tiles | "wall")}
            >
              {grid.flat().find((a) => a.type === item) && "*"}
              {item}
            </div>
          ))}
        </div>
      </div>
      {JSON.stringify(grid)}
    </main>
  );
}
