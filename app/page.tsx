"use client";

import { useEffect, useMemo, useState } from "react";

import { DAILY_BOOKING_LIMIT } from "@/lib/scheduling";
import type { AppointmentMode, ContactPreference } from "@/lib/types";

type AvailabilityResponse = {
  availability: {
    dailyLimit: number;
    dailyBooked: number;
    dailyRemaining: number;
    queueBookings: number;
    slotCapacityLimit: number;
    slots: Array<{
      time: string;
      booked: number;
      remaining: number;
      isFull: boolean;
    }>;
  };
};

export default function BookingPage() {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    contactPreference: "EMAIL" as ContactPreference,
    appointmentMode: "DROPOFF" as AppointmentMode,
    requestedDate: "",
    requestedTimeSlot: "",
    stringType: "",
    tension: "",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse["availability"] | null>(
    null,
  );

  useEffect(() => {
    async function loadAvailability() {
      if (!form.requestedDate) {
        setAvailability(null);
        return;
      }

      try {
        setIsLoadingAvailability(true);
        const response = await fetch(`/api/availability?date=${form.requestedDate}`);
        if (!response.ok) {
          setAvailability(null);
          return;
        }

        const data = (await response.json()) as AvailabilityResponse;
        setAvailability(data.availability);
      } catch {
        setAvailability(null);
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    void loadAvailability();
  }, [form.requestedDate]);

  const selectedSlotFull = useMemo(() => {
    if (!availability || !form.requestedTimeSlot) {
      return false;
    }
    const selected = availability.slots.find((slot) => slot.time === form.requestedTimeSlot);
    return selected?.isFull ?? false;
  }, [availability, form.requestedTimeSlot]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    if (!form.requestedDate) {
      setMessage("Please choose a date.");
      return;
    }

    if (form.appointmentMode !== "FLEXIBLE_QUEUE" && !form.requestedTimeSlot) {
      setMessage("Please choose a time slot.");
      return;
    }

    if (selectedSlotFull) {
      setMessage("That slot just became full. Please choose another.");
      return;
    }

    const requestedTime =
      form.appointmentMode === "FLEXIBLE_QUEUE"
        ? `${form.requestedDate}T12:00:00`
        : `${form.requestedDate}T${form.requestedTimeSlot}:00`;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          contactPreference: form.contactPreference,
          appointmentMode: form.appointmentMode,
          requestedTime,
          stringType: form.stringType,
          tension: form.tension,
          notes: form.notes,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Could not create booking.");
        return;
      }

      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        contactPreference: "EMAIL",
        appointmentMode: "DROPOFF",
        requestedDate: "",
        requestedTimeSlot: "",
        stringType: "",
        tension: "",
        notes: "",
      });
      setMessage("Booking confirmed. We will contact you shortly.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl p-6">
      <h1 className="mb-2 text-3xl font-bold">U Bring I String</h1>
      <p className="mb-6 text-sm text-gray-600">
        Book your racket stringing appointment. Daily limit: {DAILY_BOOKING_LIMIT} jobs.
      </p>

      <form onSubmit={submit} className="space-y-3 rounded border bg-white p-6 shadow">
        <input
          placeholder="Name"
          className="w-full rounded border p-2"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          required
        />

        <input
          placeholder="Email"
          type="email"
          className="w-full rounded border p-2"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
          required
        />

        <input
          placeholder="Phone"
          className="w-full rounded border p-2"
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
          required
        />

        <select
          className="w-full rounded border p-2"
          value={form.contactPreference}
          onChange={(e) =>
            setForm({ ...form, contactPreference: e.target.value as ContactPreference })
          }
        >
          <option value="EMAIL">Preferred contact: Email</option>
          <option value="PHONE">Preferred contact: Phone</option>
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.appointmentMode}
          onChange={(e) =>
            setForm({ ...form, appointmentMode: e.target.value as AppointmentMode })
          }
        >
          <option value="DROPOFF">Racket drop-off</option>
          <option value="PICKUP_REQUEST">Pickup request</option>
          <option value="FLEXIBLE_QUEUE">Flexible intake queue (first available)</option>
        </select>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="date"
            className="w-full rounded border p-2"
            value={form.requestedDate}
            onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
            required
          />

          <select
            className="w-full rounded border p-2"
            value={form.requestedTimeSlot}
            onChange={(e) => setForm({ ...form, requestedTimeSlot: e.target.value })}
            required={form.appointmentMode !== "FLEXIBLE_QUEUE"}
            disabled={form.appointmentMode === "FLEXIBLE_QUEUE" || isLoadingAvailability}
          >
            <option value="">
              {form.appointmentMode === "FLEXIBLE_QUEUE"
                ? "Queue mode does not need a slot"
                : "Select time slot"}
            </option>
            {(availability?.slots ?? []).map((slot) => (
              <option key={slot.time} value={slot.time} disabled={slot.isFull}>
                {slot.time} ({slot.remaining} left)
              </option>
            ))}
          </select>
        </div>
        {availability ? (
          <p className="text-sm text-gray-600">
            {availability.dailyRemaining} of {availability.dailyLimit} jobs remaining for this day.
          </p>
        ) : null}

        <input
          placeholder="String Type (e.g. RPM Blast 17)"
          className="w-full rounded border p-2"
          value={form.stringType}
          onChange={(e) => setForm({ ...form, stringType: e.target.value })}
          required
        />

        <input
          placeholder="Tension (lbs)"
          className="w-full rounded border p-2"
          value={form.tension}
          onChange={(e) => setForm({ ...form, tension: e.target.value })}
          required
        />

        <textarea
          placeholder='Notes (e.g. "feels loose", "hybrid setup")'
          className="w-full rounded border p-2"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          required
        />

        <button disabled={isSubmitting} className="w-full rounded bg-black py-2 text-white">
          {isSubmitting ? "Booking..." : "Book appointment"}
        </button>

        {message ? <p className="text-sm">{message}</p> : null}
      </form>

      <a className="mt-4 inline-block text-sm underline" href="/dashboard">
        Open admin dashboard
      </a>
    </div>
  );
}
