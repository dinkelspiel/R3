import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const cookie = await cookies();
  cookie.delete("rrSessionToken");
  return Response.redirect(
    `${request.nextUrl.protocol}//${request.nextUrl.host}`,
  );
};
