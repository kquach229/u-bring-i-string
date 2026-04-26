"use client";

import { useState } from "react";

import type { Job, JobStatus } from "@/lib/types";

function statusLabel(status: JobStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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
    <div className="mx-auto min-h-screen w-full max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Track Your Stringing Job</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter the same email and phone used when booking.
      </p>

      <form onSubmit={onSubmit} className="mb-6 space-y-3 rounded border bg-white p-6 shadow">
        <input
          type="email"
          className="w-full rounded border p-2"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
        <button disabled={isLoading} className="w-full rounded bg-black py-2 text-white">
          {isLoading ? "Checking..." : "Check status"}
        </button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="rounded border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">
                {job.stringType} @ {job.tension} lbs
              </p>
              <p className="text-sm font-medium">{statusLabel(job.status)}</p>
            </div>
            <p className="text-sm text-gray-700">
              Requested time: {new Date(job.requestedTime).toLocaleString()}
            </p>
            <p className="mb-2 text-sm text-gray-700">Notes: {job.notes}</p>
            <p className="mb-1 text-sm font-medium">Status history</p>
            <ul className="space-y-1 text-sm">
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
