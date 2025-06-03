import { Input } from "~/components/ui/input";
import { useGameStore } from "./state";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { sendPacket } from "./packet";
import type { CtoSPlayerChatPacket } from "~/shared/game";
import { useAuthUser } from "~/app/_components/authUserProvider";
import { Label } from "~/components/ui/label";

export const Chat = () => {
  const { chats, players, game, setLastReadChatsLength } = useGameStore();
  const authUser = useAuthUser();
  const [message, setMessage] = useState("");

  return (
    <>
      {chats.map((chat, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Label className="text-neutral-600">
            {players!.find((player) => player.id === chat.playerId)?.username}
          </Label>
          {chat.message}
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button
          className="w-fit"
          onClick={() => {
            setMessage("");
            setLastReadChatsLength(chats.length + 1);
            sendPacket({
              type: "playerChat",
              sessionToken: authUser!.sessionToken,
              gameId: game!.id,
              data: {
                message,
              },
            } satisfies CtoSPlayerChatPacket);
          }}
        >
          Send
        </Button>
      </div>
    </>
  );
};
