import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuthUser } from "./authUserProvider";
import { useEffect, useState } from "react";
import { capitalizeFirst } from "~/lib/capitalizeFirst";
import { api } from "~/trpc/react";
import { redirect, useRouter } from "next/navigation";

export const Host = () => {
  const authUser = useAuthUser();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setName(capitalizeFirst(`${authUser?.username}'s Game`));
  }, []);

  const router = useRouter();

  const createGame = api.game.create.useMutation({
    onSuccess(data) {
      router.push(`/game/${data}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">Host</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Host Lobby</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Password (optional)</Label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setOpen(false);
              createGame.mutate({
                name,
                password: password === "" ? undefined : password,
              });
            }}
          >
            Host
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
