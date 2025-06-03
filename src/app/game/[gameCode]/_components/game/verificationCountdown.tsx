"use client";

import { Label } from "~/components/ui/label";
import { useGameStore } from "../state";
import { useEffect, useState } from "react";
import { Progress } from "~/components/ui/progress";
import { compareBid } from "~/shared/game";

export const VerificationCountdown = () => {
  const { startingIn, room, players, forceUpdate } = useGameStore();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setCounter(startingIn);
    console.log(startingIn);
  }, [startingIn, forceUpdate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prevCount) => prevCount - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="text-xs text-neutral-600">
        Verification for{" "}
        {(() => {
          const bid = Object.entries(room!.currentBids)
            .filter((e) => e[1] !== null)
            .sort((a, b) => compareBid(a[1], b[1]))[0]!;

          return players?.find(
            (player) => player.id === parseInt(bid[0].toString()),
          )?.username;
        })()}{" "}
        ends in {counter}s
      </div>
      <Progress value={(startingIn / 100) * counter * 100} />
    </div>
  );
};
