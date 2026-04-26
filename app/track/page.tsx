"use client";

import { useState } from "react";

import type { Job, JobStatus } from "@/lib/types";

function statusLabel(status: JobStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusClasses(status: JobStatus): string {
  if (status === "PENDING") return "status-pending";
  if (status === "IN_PROGRESS") return "status-progress";
  if (status === "READY_FOR_PICKUP") return "status-ready";
  return "status-completed";
}

export default function TrackPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setJobs([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/public/jobs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = (await response.json()) as { jobs?: Job[]; error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not find your jobs.");
        return;
      }
      const matchedJobs = data.jobs ?? [];
      setJobs(matchedJobs);
      if (matchedJobs.length === 0) {
        setMessage("No matching jobs found for that email + phone.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl p-4 sm:p-6 soft-enter">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
        Customer Portal
      </p>
      <h1 className="mb-2 text-3xl font-bold">Track Your Stringing Job</h1>
      <p className="mb-6 text-sm text-slate-600">
        Enter the same email and phone used when booking.
      </p>

      <form
        onSubmit={onSubmit}
        className="card-surface mb-6 space-y-3 rounded-2xl p-6 shadow-lg"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="email"
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            placeholder="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
        <button
          disabled={isLoading}
          className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-blue-700 py-2.5 font-semibold text-white hover:from-slate-800 hover:to-blue-600"
        >
          {isLoading ? "Checking..." : "Check status"}
        </button>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </form>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="card-surface rounded-2xl p-4 lift-on-hover">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">
                {job.stringType} @ {job.tension} lbs
              </p>
              <p
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClasses(job.status)}`}
              >
                {statusLabel(job.status)}
              </p>
            </div>
            <p className="text-sm text-slate-700">
              Requested time: {new Date(job.requestedTime).toLocaleString()}
            </p>
            <p className="mb-2 text-sm text-slate-700">Notes: {job.notes}</p>
            <p className="mb-1 text-sm font-medium text-slate-800">Status history</p>
            <ul className="space-y-1 text-sm text-slate-700">
              {job.statusTimeline.map((entry) => (
                <li key={`${job.id}-${entry.status}-${entry.timestamp}`}>
                  {statusLabel(entry.status)} - {new Date(entry.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
