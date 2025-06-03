import { Cog, LoaderPinwheel, Moon, Orbit, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { RadialPinwheel } from "./radialPinwheel";

export const Goal = ({ goalString }: { goalString: string }) => {
  const [color, setColor] = useState<[string, string]>(["", ""]);
  useEffect(() => {
    setColor(
      (
        {
          green: ["bg-green-500", "fill-green-500"],
          blue: ["bg-blue-500", "fill-blue-500"],
          yellow: ["bg-amber-500", "fill-amber-500"],
          red: ["bg-red-500", "fill-red-500"],
          joker: ["", ""],
        } as Record<string, [string, string]>
      )[goalString.split("_")[0]!]!,
    );
  }, [goalString]);

  if (goalString === "joker") {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center rounded-full",
          color,
        )}
      >
        <RadialPinwheel />
      </div>
    );
  }

  return {
    moon: (
      <div
        className={cn(
          "flex size-full items-center justify-center rounded-full",
          color,
        )}
      >
        <Moon className="size-[70%]" />
      </div>
    ),
    star: (
      <div className="relative flex size-full items-center justify-center rounded-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="44"
          height="50"
          viewBox="0 0 44 50"
          fill="none"
          className="absolute size-[110%]"
        >
          <path
            d="M20 1.1547C21.2376 0.440169 22.7624 0.440169 24 1.1547L41.6506 11.3453C42.8882 12.0598 43.6506 13.3803 43.6506 14.8094V35.1906C43.6506 36.6197 42.8882 37.9402 41.6506 38.6547L24 48.8453C22.7624 49.5598 21.2376 49.5598 20 48.8453L2.34936 38.6547C1.11176 37.9402 0.349365 36.6197 0.349365 35.1906V14.8094C0.349365 13.3803 1.11176 12.0598 2.34937 11.3453L20 1.1547Z"
            className={color ? color[1] : ""}
          />
        </svg>
        <Star className="absolute size-[70%]" />
      </div>
    ),
    cog: (
      <div
        className={cn(
          "relative flex size-full items-center justify-center rounded-full",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="38"
          height="34"
          viewBox="0 0 38 34"
          fill="none"
          className="absolute size-[110%]"
        >
          <path
            d="M15.5359 2C17.0755 -0.666666 20.9245 -0.666667 22.4641 2L37.1865 27.5C38.7261 30.1667 36.8016 33.5 33.7224 33.5H4.27757C1.19837 33.5 -0.726134 30.1667 0.813467 27.5L15.5359 2Z"
            className={color ? color[1] : ""}
          />
        </svg>
        <Cog className="absolute mt-1 size-[50%]" />
      </div>
    ),
    planet: (
      <div
        className={cn(
          "flex size-full items-center justify-center rounded-sm",
          color,
        )}
      >
        <Orbit className="size-[70%]" />
      </div>
    ),
  }[goalString.split("_")[1]!];
};
