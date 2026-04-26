import StatusButton from "../components/StatusButton";
import { requireAdminPageSession } from "@/lib/admin-auth";
import { getDayAvailability, getJobs } from "@/lib/jobs-store";
import type { JobStatus } from "@/lib/types";

const STATUS_FILTERS: Array<{ value: "ALL" | JobStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "COMPLETED", label: "Completed" },
];

function statusLabel(status: JobStatus): string {
  return status
    .split("_")
    .map((chunk) => chunk.charAt(0) + chunk.slice(1).toLowerCase())
    .join(" ");
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  await requireAdminPageSession();

  const params = await searchParams;
  const selectedStatus = (params.status ?? "ALL") as "ALL" | JobStatus;
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);
  const jobs = await getJobs();
  const filteredJobs =
    selectedStatus === "ALL"
      ? jobs
      : jobs.filter((job) => job.status === selectedStatus);
  const today = new Date().toISOString().slice(0, 10);
  const todaysJobs = jobs.filter((job) => job.requestedTime.startsWith(today));
  const selectedDayAvailability = await getDayAvailability(selectedDate);

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs Dashboard</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">Today&apos;s workload: {todaysJobs.length}</p>
          <form action="/api/admin/logout" method="post">
            <button className="rounded border px-2 py-1 text-sm">Logout</button>
          </form>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <a
            key={filter.value}
            href={`/dashboard?status=${filter.value}&date=${selectedDate}`}
            className={`rounded border px-3 py-1 text-sm ${
              selectedStatus === filter.value ? "bg-black text-white" : "bg-white"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      <div className="mb-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-semibold">Scheduling Flow</h2>
        <form className="mb-3">
          <label className="text-sm">
            Date:{" "}
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded border px-2 py-1"
            />
          </label>
          <input type="hidden" name="status" value={selectedStatus} />
          <button className="ml-2 rounded border px-2 py-1 text-sm">View</button>
        </form>
        <p className="mb-2 text-sm text-gray-700">
          {selectedDayAvailability.dailyBooked} / {selectedDayAvailability.dailyLimit} booked
          (remaining: {selectedDayAvailability.dailyRemaining})
        </p>
        <p className="mb-3 text-sm text-gray-700">
          Flexible queue bookings: {selectedDayAvailability.queueBookings}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-4">
          {selectedDayAvailability.slots.map((slot) => (
            <div key={slot.time} className="rounded border p-2">
              <p className="font-medium">{slot.time}</p>
              <p>
                {slot.booked} booked / {selectedDayAvailability.slotCapacityLimit}
              </p>
              <p>{slot.remaining} left</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <div key={job.id} className="rounded border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{job.customerName}</p>
              <p className="text-sm">{statusLabel(job.status)}</p>
            </div>

            <p className="text-sm">
              Contact: {job.customerEmail} | {job.customerPhone}
            </p>
            <p className="text-sm">
              {job.stringType} @ {job.tension} lbs
            </p>
            <p className="text-sm">
              {job.appointmentMode === "DROPOFF"
                ? "Drop-off"
                : job.appointmentMode === "PICKUP_REQUEST"
                  ? "Pickup request"
                  : "Flexible queue"}{" "}
              at {new Date(job.requestedTime).toLocaleString()}
            </p>
            <p className="mb-3 text-sm">Notes: {job.notes}</p>

            <StatusButton id={job.id} currentStatus={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
