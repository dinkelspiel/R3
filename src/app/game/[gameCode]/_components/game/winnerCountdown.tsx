"use client";

import { Label } from "~/components/ui/label";
import { useGameStore } from "../state";
import { useEffect, useState } from "react";
import { Progress } from "~/components/ui/progress";
import { compareBid } from "~/shared/game";

export const WinnerCountdown = () => {
  const { startingIn } = useGameStore();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setCounter(startingIn);
    console.log(startingIn);
  }, [startingIn]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prevCount) => prevCount - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="text-xs text-neutral-600">
        Next game starts in {counter}s
      </div>
      <Progress value={(counter / startingIn) * 100} />
    </div>
  );
};
