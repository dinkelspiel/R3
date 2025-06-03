"use client";

import { Button } from "~/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Error } from "./_components/error";
import Link from "next/link";
import { useAuthUser } from "./_components/authUserProvider";
import { Host } from "./_components/host";
import { api } from "~/trpc/react";

const Page = () => {
  const authUser = useAuthUser();
  const gamesInLobby = api.game.getGamesInLobby.useQuery();

  return (
    <div className="flex min-h-[100dvh] justify-center bg-neutral-50">
      <main className="flex w-[1024px] flex-col gap-4 p-4">
        <h1 className="py-6 text-center text-2xl font-semibold">
          Ricochet Robots
        </h1>
        <div className="flex justify-between gap-2">
          {!authUser && (
            <div className="flex items-center gap-2">
              <Link href={"/auth/login?state=login"}>
                <Button>Login</Button>
              </Link>
              <Link href={"/auth/login?state=signup"}>
                <Button>Create an Account</Button>
              </Link>
            </div>
          )}
          {authUser && (
            <>
              <Host />
              <div className="flex items-center gap-2">
                <div className="ms-auto flex items-center">
                  Logged in as @{authUser.username}
                </div>
                <Link href="/api/auth/logout">
                  <Button>Log out</Button>
                </Link>
              </div>
            </>
          )}
        </div>
        {!gamesInLobby.data && <Loader2 className="size-4 animate-spin" />}
        {gamesInLobby.data && (
          <div className="grid grid-cols-3 gap-2">
            {gamesInLobby.data.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {game.name} {game.password && <Lock className="size-4" />}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="justify-between">
                  <div className="text-xs text-neutral-600">5 players</div>
                  <Link
                    href={
                      authUser
                        ? `/game/${game.code}`
                        : `/auth/login?state=signup`
                    }
                  >
                    <Button>Join</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Error />
    </div>
  );
};

export default Page;
