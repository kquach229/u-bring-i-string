import { NextResponse } from "next/server";

import { getCustomerJobs } from "@/lib/jobs-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; phone?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() ?? "";

    if (!email || !phone) {
      return NextResponse.json(
        { error: "Email and phone are required." },
        { status: 400 },
      );
    }

    const jobs = await getCustomerJobs(email, phone);
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Unable to lookup jobs." }, { status: 500 });
  }
}
