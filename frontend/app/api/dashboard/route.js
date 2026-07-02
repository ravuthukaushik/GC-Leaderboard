import { NextResponse } from "next/server";
import { getDashboardPayload } from "@/lib/dashboard";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const weekId = searchParams.get("week");
  const payload = await getDashboardPayload(weekId || undefined);
  return NextResponse.json(payload);
}
