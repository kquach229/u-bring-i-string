"use client";

import { useState } from "react";

import type { JobStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{ label: string; value: JobStatus }> = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
  { label: "Completed", value: "COMPLETED" },
];

export default function StatusButton({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: JobStatus;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const update = async (status: string) => {
    setIsSaving(true);
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    setIsSaving(false);
    location.reload();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((option) => {
        const isActive = currentStatus === option.value;
        return (
          <button
            key={option.value}
            disabled={isSaving || isActive}
            onClick={() => update(option.value)}
            className={`rounded border px-2 py-1 text-sm ${
              isActive ? "bg-black text-white" : "bg-white"
            } disabled:opacity-60`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
