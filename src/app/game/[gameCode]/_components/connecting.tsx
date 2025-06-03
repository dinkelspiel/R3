import { Dot } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export const Connecting = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prevCount) => prevCount + 1);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-neutral-50">
      <Card
        className={cn("w-[250px]", {
          "opacity-0": counter === 0,
        })}
      >
        <CardHeader className="flex h-fit items-center">
          <CardTitle className="flex items-center gap-4">
            Connecting{" "}
            <div className="flex">
              {Array(3)
                .fill(1)
                .map((_, idx) => (
                  <Dot
                    key={idx}
                    className={cn(
                      "stroke-neutral-600",
                      idx < counter % 4 ? "opacity-100" : "opacity-0",
                    )}
                  />
                ))}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </main>
  );
};
