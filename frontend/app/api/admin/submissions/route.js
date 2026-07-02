import { NextResponse } from "next/server";
import { getViewer, submitWeeklyEntry } from "@/lib/dashboard";

export async function POST(request) {
  const viewer = await getViewer();

  if (!viewer?.isAdmin) {
    return NextResponse.json(
      { error: "Only department accounts can submit Green Cup data." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const result = await submitWeeklyEntry(body, viewer);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json(result.data);
}
