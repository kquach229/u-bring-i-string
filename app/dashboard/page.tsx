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

function statusClasses(status: JobStatus): string {
  if (status === "PENDING") return "status-pending";
  if (status === "IN_PROGRESS") return "status-progress";
  if (status === "READY_FOR_PICKUP") return "status-ready";
  return "status-completed";
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
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 soft-enter">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Admin Panel
          </p>
          <h1 className="text-3xl font-bold">Jobs Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800">
            Today&apos;s workload: {todaysJobs.length}
          </p>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-full border border-slate-300 bg-white/70 px-3 py-1.5 text-sm font-medium hover:bg-white">
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <a
            key={filter.value}
            href={`/dashboard?status=${filter.value}&date=${selectedDate}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              selectedStatus === filter.value
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-slate-300 bg-white/70 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      <div className="card-surface mb-6 rounded-2xl p-5 lift-on-hover">
        <h2 className="mb-2 text-lg font-semibold">Scheduling Flow</h2>
        <form className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            Date:{" "}
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5"
            />
          </label>
          <input type="hidden" name="status" value={selectedStatus} />
          <button className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100">
            View
          </button>
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
            <div key={slot.time} className="rounded-xl border border-slate-200 bg-white/80 p-2.5">
              <p className="font-semibold text-slate-800">{slot.time}</p>
              <p>
                {slot.booked} booked / {selectedDayAvailability.slotCapacityLimit}
              </p>
              <p className={slot.remaining === 0 ? "text-rose-600" : "text-emerald-700"}>
                {slot.remaining} left
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="card-surface rounded-2xl p-4 lift-on-hover">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{job.customerName}</p>
              <p
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClasses(job.status)}`}
              >
                {statusLabel(job.status)}
              </p>
            </div>

            <p className="text-sm text-slate-700">
              Contact: {job.customerEmail} | {job.customerPhone}
            </p>
            <p className="text-sm text-slate-700">
              {job.stringType} @ {job.tension} lbs
            </p>
            <p className="text-sm text-slate-700">
              {job.appointmentMode === "DROPOFF"
                ? "Drop-off"
                : job.appointmentMode === "PICKUP_REQUEST"
                  ? "Pickup request"
                  : "Flexible queue"}{" "}
              at {new Date(job.requestedTime).toLocaleString()}
            </p>
            <p className="mb-3 text-sm text-slate-700">Notes: {job.notes}</p>

            <StatusButton id={job.id} currentStatus={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
