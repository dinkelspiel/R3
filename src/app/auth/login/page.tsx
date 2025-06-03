"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Error } from "~/components/ui/error";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

const Page = () => {
  const searchParams = useSearchParams();
  const [state, setState] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (searchParams.get("state")) {
      setState(searchParams.get("state") as "login" | "signup");
    }
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const signUp = api.auth.signUp.useMutation({
    onSuccess(data) {
      toast.success(data.message);
    },
  });
  const login = api.auth.login.useMutation({
    onSuccess(data) {
      toast.success(data.message);
    },
  });

  return (
    <div className="flex min-h-[100dvh] justify-center bg-neutral-50">
      <main className="flex w-[450px] flex-col gap-4 p-4">
        {(() => {
          if (state === "login") {
            return (
              <>
                <div className="grid grid-cols-[80px_1fr_80px] items-center">
                  <Link
                    href="/"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <ChevronLeft className="size-4" /> Tillbaka
                  </Link>
                  <h1 className="py-6 text-center text-2xl font-semibold">
                    Login
                  </h1>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col items-start gap-2">
                  <Button
                    onClick={() =>
                      login.mutate({
                        email,
                      })
                    }
                    className="w-full"
                  >
                    Login
                  </Button>
                  <button
                    className="cursor-pointer text-sm text-blue-500 hover:underline"
                    onClick={() => setState("signup")}
                  >
                    Don{"'"}t have an account?
                  </button>
                </div>
                {login.data && (
                  <Alert>
                    <AlertTitle>Sent Mail</AlertTitle>
                    <AlertDescription>{login.data.message}</AlertDescription>
                  </Alert>
                )}
              </>
            );
          }

          return (
            <>
              <div className="grid grid-cols-[80px_1fr_80px] items-center">
                <Link
                  href="/"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <ChevronLeft className="size-4" /> Tillbaka
                </Link>
                <h1 className="py-6 text-center text-2xl font-semibold">
                  Create an account
                </h1>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Button
                  onClick={() =>
                    signUp.mutate({
                      email,
                      username,
                    })
                  }
                  className="w-full"
                >
                  Create account
                </Button>
                <button
                  className="cursor-pointer text-sm text-blue-500 hover:underline"
                  onClick={() => setState("login")}
                >
                  Already have an account?
                </button>
              </div>
              {signUp.error?.data!.zodError?.fieldErrors &&
                Object.keys(signUp.error.data.zodError.fieldErrors).map(
                  (error) => (
                    <Error
                      key={error}
                      message={
                        signUp.error.data!.zodError!.fieldErrors[error]![0]
                      }
                    />
                  ),
                )}
              {signUp.error && <Error message={signUp.error.message} />}
              {signUp.data && (
                <Alert>
                  <AlertTitle>Created Account</AlertTitle>
                  <AlertDescription>{signUp.data.message}</AlertDescription>
                </Alert>
              )}
            </>
          );
        })()}
      </main>
    </div>
  );
};

export default Page;
