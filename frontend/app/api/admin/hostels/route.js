import { NextResponse } from "next/server";
import { getViewer, updateHostelData } from "@/lib/dashboard";

export async function POST(request) {
  const viewer = await getViewer();

  if (viewer?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admin accounts can update hostel data." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const result = await updateHostelData(body.hostels || [], viewer);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({ hostels: result.data });
}
