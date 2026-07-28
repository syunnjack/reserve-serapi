import { NextRequest, NextResponse } from "next/server";
import { exchangeLineLoginCode } from "@/lib/line";
import { getCurrentUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("line_login_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/dashboard/customer?error=line_failed", request.url));
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const redirectUri = new URL("/api/line/callback", request.url).toString();
  const result = await exchangeLineLoginCode(code, redirectUri);
  if (!result) {
    return NextResponse.redirect(new URL("/dashboard/customer?error=line_failed", request.url));
  }

  const supabase = createServiceRoleClient();
  await supabase.from("rsp_profiles").update({ line_user_id: result.lineUserId }).eq("id", user.id);

  return NextResponse.redirect(new URL("/dashboard/customer?line=linked", request.url));
}
