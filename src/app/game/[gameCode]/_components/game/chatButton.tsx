import { useAuthUser } from "~/app/_components/authUserProvider";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useGameStore } from "../state";
import { MessageCircle } from "lucide-react";
import { Chat } from "../chat";

export const ChatButton = () => {
  const authUser = useAuthUser();
  const {
    players,
    room,
    setLastReadChatsLength,
    lastReadChatsLength,
    chats,
    setRoom,
    setHighlightMovement,
    game,
  } = useGameStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            variant={"ghost"}
            className="aspect-square"
            onClick={() => setLastReadChatsLength(chats.length)}
          >
            <MessageCircle className="size-4" />
          </Button>
          {lastReadChatsLength < chats.length && (
            <span className="absolute top-0 right-0 block h-2 w-2 animate-pulse rounded-full bg-red-500 ring-2 ring-white"></span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="me-4">
        <Chat />
      </PopoverContent>
    </Popover>
  );
};
