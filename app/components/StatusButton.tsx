"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { JobStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{ label: string; value: JobStatus }> = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
  { label: "Completed", value: "COMPLETED" },
];

function buttonClasses(value: JobStatus, isActive: boolean): string {
  const base =
    "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase disabled:opacity-55";
  if (isActive) {
    if (value === "PENDING") return `${base} status-pending border-orange-200`;
    if (value === "IN_PROGRESS") return `${base} status-progress border-blue-200`;
    if (value === "READY_FOR_PICKUP") return `${base} status-ready border-emerald-200`;
    return `${base} status-completed border-violet-200`;
  }
  return `${base} bg-white/80 border-slate-200 hover:border-blue-300 hover:bg-blue-50`;
}

export default function StatusButton({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: JobStatus;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const update = async (status: string) => {
    setIsSaving(true);
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    setIsSaving(false);
    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }
    router.refresh();
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
            className={buttonClasses(option.value, isActive)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
