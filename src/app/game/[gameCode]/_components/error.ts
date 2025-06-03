"use client";

import { redirect } from "next/navigation";

export const redirectError = (error: string) => {
  redirect(`/?error=${error}`);
};
