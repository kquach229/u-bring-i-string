export const JOB_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "READY_FOR_PICKUP",
  "COMPLETED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type ContactPreference = "EMAIL" | "PHONE";

export type AppointmentMode = "DROPOFF" | "PICKUP_REQUEST" | "FLEXIBLE_QUEUE";

export type BookingInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  contactPreference: ContactPreference;
  appointmentMode: AppointmentMode;
  requestedTime: string;
  stringType: string;
  tension: string;
  notes: string;
};

export type Job = BookingInput & {
  id: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  statusTimeline: Array<{
    status: JobStatus;
    timestamp: string;
  }>;
};
