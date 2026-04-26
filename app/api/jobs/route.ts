import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { createJob, getJobs } from "@/lib/jobs-store";
import type { BookingInput } from "@/lib/types";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const jobs = await getJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingInput;
    const requiredFields: Array<keyof BookingInput> = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "contactPreference",
      "appointmentMode",
      "requestedTime",
      "stringType",
      "tension",
      "notes",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const job = await createJob(body);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create booking.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
