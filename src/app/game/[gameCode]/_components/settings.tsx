"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useGameStore } from "./state";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { sendPacket } from "./packet";
import type { CtoSUpdateSettingsPacket } from "~/shared/game";
import { useAuthUser } from "~/app/_components/authUserProvider";

export const Settings = () => {
  const { room, game } = useGameStore();
  const authUser = useAuthUser();
  if (!room || !authUser || !game) return;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        {Object.keys(room.settings).map((setting) => (
          <div key={setting} className="flex flex-col gap-2">
            <Label>{setting}</Label>
            <Input
              onChange={(e) =>
                sendPacket({
                  type: "updateSettings",
                  sessionToken: authUser.sessionToken,
                  gameId: game.id,
                  data: {
                    ...room.settings,
                    [setting]: parseInt(e.target.value),
                  },
                } satisfies CtoSUpdateSettingsPacket)
              }
              defaultValue={
                room.settings[setting as keyof typeof room.settings]
              }
              type="number"
            />
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
};
