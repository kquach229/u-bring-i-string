import { NextResponse } from "next/server";

import { getDayAvailability } from "@/lib/jobs-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Missing date query parameter." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date must be in YYYY-MM-DD format." }, { status: 400 });
  }

  const availability = await getDayAvailability(date);
  return NextResponse.json({ availability });
}
