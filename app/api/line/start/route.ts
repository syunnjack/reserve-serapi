import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { lineLoginAuthorizeUrl } from "@/lib/line";

export async function GET(request: NextRequest) {
  const state = randomUUID();
  const redirectUri = new URL("/api/line/callback", request.url).toString();
  const authorizeUrl = lineLoginAuthorizeUrl(state, redirectUri);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("line_login_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return response;
}
