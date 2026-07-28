import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/data";

export async function GET(request: NextRequest) {
  const therapistId = Number(request.nextUrl.searchParams.get("therapistId"));
  const date = request.nextUrl.searchParams.get("date");
  const duration = Number(request.nextUrl.searchParams.get("duration") ?? 60);

  if (!therapistId || !date) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const slots = await getAvailableSlots(therapistId, date, duration);
  return NextResponse.json({ slots });
}
