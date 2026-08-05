import { NextResponse } from "next/server";
import { resolveActingUserId } from "@/lib/resolveUser";
import { getSummary } from "@/lib/summary";

export async function GET(req: Request) {
  const userId = await resolveActingUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await getSummary(userId);
  return NextResponse.json(summary);
}
