"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { usePushRoute } from "use-push-router";

export const Error = ({ error }: { error?: string }) => {
  const [open, setOpen] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const { pushSearchParams } = usePushRoute();

  useEffect(() => {
    setOpen(!!searchParams.get("error"));
  }, []);

  return (
    <Dialog
      open={!!open}
      onOpenChange={(open) => {
        setOpen(open);
        pushSearchParams({
          remove: {
            error: undefined,
          },
        });
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
        </DialogHeader>
        {searchParams.get("error")}
      </DialogContent>
    </Dialog>
  );
};
