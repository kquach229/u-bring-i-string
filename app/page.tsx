"use client";

import { useEffect, useMemo, useState } from "react";

import { DAILY_BOOKING_LIMIT, generateTimeSlots } from "@/lib/scheduling";
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
  const fallbackSlots = useMemo(() => generateTimeSlots(), []);
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
  const [availabilityError, setAvailabilityError] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse["availability"] | null>(
    null,
  );

  useEffect(() => {
    async function loadAvailability() {
      if (!form.requestedDate) {
        setAvailability(null);
        setAvailabilityError(false);
        return;
      }

      try {
        setIsLoadingAvailability(true);
        const response = await fetch(`/api/availability?date=${form.requestedDate}`);
        if (!response.ok) {
          setAvailability(null);
          setAvailabilityError(true);
          return;
        }

        const data = (await response.json()) as AvailabilityResponse;
        setAvailability(data.availability);
        setAvailabilityError(false);
      } catch {
        setAvailability(null);
        setAvailabilityError(true);
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

  const slotOptions = availability?.slots ?? fallbackSlots.map((time) => ({
    time,
    booked: 0,
    remaining: 0,
    isFull: false,
  }));

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
    <div className="mx-auto min-h-screen w-full max-w-3xl p-4 sm:p-6 soft-enter">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
        Customer Booking
      </p>
      <h1 className="mb-2 text-4xl font-bold leading-tight">U Bring I String</h1>
      <p className="mb-6 text-sm text-slate-600">
        Book your racket stringing appointment in under a minute. Daily limit:{" "}
        {DAILY_BOOKING_LIMIT} jobs.
      </p>

      <form
        onSubmit={submit}
        className="card-surface space-y-4 rounded-2xl p-5 shadow-xl sm:p-6"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            placeholder="Name"
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            required
          />

          <input
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            value={form.customerEmail}
            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            required
          />
        </div>
        <input
          placeholder="Phone"
          className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            value={form.contactPreference}
            onChange={(e) =>
              setForm({ ...form, contactPreference: e.target.value as ContactPreference })
            }
          >
            <option value="EMAIL">Preferred contact: Email</option>
            <option value="PHONE">Preferred contact: Phone</option>
          </select>

          <select
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            value={form.appointmentMode}
            onChange={(e) =>
              setForm({ ...form, appointmentMode: e.target.value as AppointmentMode })
            }
          >
            <option value="DROPOFF">Racket drop-off</option>
            <option value="PICKUP_REQUEST">Pickup request</option>
            <option value="FLEXIBLE_QUEUE">Flexible intake queue (first available)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            value={form.requestedDate}
            onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
            required
          />

          <select
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
            value={form.requestedTimeSlot}
            onChange={(e) => setForm({ ...form, requestedTimeSlot: e.target.value })}
            required={form.appointmentMode !== "FLEXIBLE_QUEUE"}
            disabled={form.appointmentMode === "FLEXIBLE_QUEUE"}
          >
            <option value="">
              {form.appointmentMode === "FLEXIBLE_QUEUE"
                ? "Queue mode does not need a slot"
                : "Select time slot"}
            </option>
            {slotOptions.map((slot) => (
              <option key={slot.time} value={slot.time} disabled={slot.isFull}>
                {availability
                  ? `${slot.time} (${slot.remaining} left)`
                  : `${slot.time} (availability loading)`}
              </option>
            ))}
          </select>
        </div>
        {isLoadingAvailability && form.appointmentMode !== "FLEXIBLE_QUEUE" ? (
          <p className="text-sm text-slate-600">Loading live slot availability...</p>
        ) : null}
        {availabilityError && form.appointmentMode !== "FLEXIBLE_QUEUE" ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Live availability is unavailable right now. You can still select a time slot and submit.
          </p>
        ) : null}
        {availability ? (
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {availability.dailyRemaining} of {availability.dailyLimit} jobs remaining for this day.
          </p>
        ) : null}

        <input
          placeholder="String Type (e.g. RPM Blast 17)"
          className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
          value={form.stringType}
          onChange={(e) => setForm({ ...form, stringType: e.target.value })}
          required
        />

        <input
          placeholder="Tension (lbs)"
          className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
          value={form.tension}
          onChange={(e) => setForm({ ...form, tension: e.target.value })}
          required
        />

        <textarea
          placeholder='Notes (e.g. "feels loose", "hybrid setup")'
          className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          required
        />

        <button
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 py-2.5 font-semibold text-white hover:from-blue-600 hover:to-indigo-500"
        >
          {isSubmitting ? "Booking..." : "Book appointment"}
        </button>

        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          className="rounded-full border border-slate-300 bg-white/75 px-4 py-2 text-sm font-medium hover:bg-white"
          href="/track"
        >
          Track my order
        </a>
        <a
          className="rounded-full border border-slate-300 bg-white/75 px-4 py-2 text-sm font-medium hover:bg-white"
          href="/admin/login"
        >
          Admin sign-in
        </a>
      </div>
    </div>
  );
}
