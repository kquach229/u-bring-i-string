import { NextResponse } from "next/server";

import { createJob, getJobs } from "@/lib/jobs-store";
import { sendBookingConfirmation } from "@/lib/notifications";
import type { BookingInput } from "@/lib/types";

export async function GET() {
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
    await sendBookingConfirmation(job);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create booking.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
