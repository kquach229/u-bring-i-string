import { NextResponse } from "next/server";

import { getJobById, updateJobStatus } from "@/lib/jobs-store";
import { sendReadyForPickupNotification } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const job = await getJobById(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status) {
      return NextResponse.json({ error: "Missing status." }, { status: 400 });
    }

    const job = await updateJobStatus(id, body.status);
    if (job.status === "READY_FOR_PICKUP") {
      await sendReadyForPickupNotification(job);
    }

    return NextResponse.json({ job });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update job.";
    const statusCode = message === "Job not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
