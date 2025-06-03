import { Loader2, Star } from "lucide-react";
import { useGameStore } from "./state";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useAuthUser } from "~/app/_components/authUserProvider";
import { sendPacket } from "./packet";
import type { CtoSRequestGameStartPacket } from "~/shared/game";
import { Disconnected } from "./disconnected";
import { Input } from "~/components/ui/input";
import { Chat } from "./chat";

export const Lobby = () => {
  const authUser = useAuthUser();
  // This is unreachable since a user can't be in the game while logged out
  if (!authUser) {
    throw Error("Not logged in in lobby");
  }

  const { game, players, connection, chats } = useGameStore();
  if (!game || !players) {
    return <Loader2 className="size-4 animate-spin" />;
  }
  return (
    <div className="flex min-h-[100dvh] justify-center bg-neutral-50">
      <main className="flex w-[1024px] flex-col gap-4 p-4">
        {connection !== "connected" && <Disconnected />}
        <h1 className="py-6 text-center text-2xl font-semibold">{game.name}</h1>
        {game.ownerId === authUser.id && (
          <>
            <Button
              className="w-fit"
              onClick={() =>
                sendPacket({
                  type: "requestGameStart",
                  sessionToken: authUser.sessionToken,
                  gameId: game.id,
                } satisfies CtoSRequestGameStartPacket)
              }
            >
              Start Game
            </Button>
          </>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">Players</h2>
            {players.map((player) => (
              <div key={player.username} className="flex items-center gap-2">
                {player.username}{" "}
                {player.id === game.ownerId && (
                  <Star className={"size-4 stroke-amber-400"} />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">Chat</h2>
            <Chat />
          </div>
        </div>
      </main>
    </div>
  );
};
