"use client";

import { Label } from "~/components/ui/label";
import { useGameStore } from "../state";
import { useEffect, useState } from "react";

export const StartingCountdown = () => {
  const { startingIn } = useGameStore();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setCounter(startingIn);
  }, [startingIn]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prevCount) => prevCount - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex size-32 flex-col items-center justify-center gap-2 rounded-lg bg-neutral-200">
      <Label>Starting in</Label>
      <div className="text-6xl font-semibold">{counter}</div>
    </div>
  );
};
