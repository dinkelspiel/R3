"use client";

import { Label } from "~/components/ui/label";
import { useGameStore } from "../state";
import { useEffect, useState } from "react";
import { Progress } from "~/components/ui/progress";

export const BiddingEndCountdown = () => {
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
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="text-xs text-neutral-600">Bidding ends in {counter}s</div>
      <Progress value={(startingIn / 100) * counter * 100} />
    </div>
  );
};
