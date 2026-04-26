import {
  DAILY_BOOKING_LIMIT,
  SLOT_CAPACITY_LIMIT,
  generateTimeSlots,
  getDateKey,
  getTimeKey,
} from "./scheduling";
import { prisma } from "./prisma";
import { JOB_STATUSES, type BookingInput, type Job, type JobStatus } from "./types";

type JobRecord = NonNullable<Awaited<ReturnType<typeof prisma.job.findFirst>>>;

type StatusTimelineEntry = {
  status: JobStatus;
  timestamp: string;
};

function isValidStatus(status: string): status is JobStatus {
  return JOB_STATUSES.includes(status as JobStatus);
}

function toAppJob(record: JobRecord): Job {
  const statusTimeline = Array.isArray(record.statusTimeline)
    ? (record.statusTimeline as unknown as StatusTimelineEntry[])
    : [];

  return {
    id: record.id,
    customerName: record.customerName,
    customerEmail: record.customerEmail,
    customerPhone: record.customerPhone,
    contactPreference: record.contactPreference,
    appointmentMode: record.appointmentMode,
    requestedTime: record.requestedTime.toISOString(),
    stringType: record.stringType,
    tension: record.tension,
    notes: record.notes,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    statusTimeline,
  };
}

export async function getJobs(): Promise<Job[]> {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
  });
  return jobs.map(toAppJob);
}

type DayAvailability = {
  date: string;
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

export async function getDayAvailability(date: string): Promise<DayAvailability> {
  const jobs = await getJobsForDate(date);
  const dayJobs = jobs.filter((job) => getDateKey(job.requestedTime) === date);
  const queueBookings = dayJobs.filter(
    (job) => job.appointmentMode === "FLEXIBLE_QUEUE",
  ).length;
  const slotCounts = new Map<string, number>();

  for (const job of dayJobs) {
    if (job.appointmentMode === "FLEXIBLE_QUEUE") {
      continue;
    }
    const key = getTimeKey(job.requestedTime);
    slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
  }

  const slots = generateTimeSlots().map((time) => {
    const booked = slotCounts.get(time) ?? 0;
    const remaining = Math.max(0, SLOT_CAPACITY_LIMIT - booked);
    return {
      time,
      booked,
      remaining,
      isFull: remaining === 0,
    };
  });

  const dailyBooked = dayJobs.length;
  return {
    date,
    dailyLimit: DAILY_BOOKING_LIMIT,
    dailyBooked,
    dailyRemaining: Math.max(0, DAILY_BOOKING_LIMIT - dailyBooked),
    queueBookings,
    slotCapacityLimit: SLOT_CAPACITY_LIMIT,
    slots,
  };
}

async function getJobsForDate(date: string): Promise<Job[]> {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  const jobs = await prisma.job.findMany({
    where: {
      requestedTime: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return jobs.map(toAppJob);
}

export async function createJob(input: BookingInput): Promise<Job> {
  const date = getDateKey(input.requestedTime);
  const dayAvailability = await getDayAvailability(date);
  if (dayAvailability.dailyRemaining <= 0) {
    throw new Error("Daily booking limit reached for selected day.");
  }

  if (input.appointmentMode !== "FLEXIBLE_QUEUE") {
    const selectedSlot = getTimeKey(input.requestedTime);
    const slot = dayAvailability.slots.find((entry) => entry.time === selectedSlot);
    if (!slot) {
      throw new Error("Selected time slot is outside working hours.");
    }
    if (slot.isFull) {
      throw new Error("Selected time slot is already full.");
    }
  }

  const now = new Date().toISOString();
  const job = await prisma.job.create({
    data: {
      ...input,
      requestedTime: new Date(input.requestedTime),
      status: "PENDING",
      statusTimeline: [{ status: "PENDING", timestamp: now }],
    },
  });
  return toAppJob(job);
}

export async function updateJobStatus(id: string, status: string): Promise<Job> {
  if (!isValidStatus(status)) {
    throw new Error("Invalid status.");
  }

  const previous = await prisma.job.findUnique({ where: { id } });
  if (!previous) {
    throw new Error("Job not found.");
  }

  const now = new Date().toISOString();
  const previousTimeline = Array.isArray(previous.statusTimeline)
    ? (previous.statusTimeline as unknown as StatusTimelineEntry[])
    : [];

  const updated = await prisma.job.update({
    where: { id },
    data: {
      status,
      statusTimeline:
        previous.status === status
          ? previousTimeline
          : [...previousTimeline, { status, timestamp: now }],
    },
  });

  return toAppJob(updated);
}

export async function getJobById(id: string): Promise<Job | null> {
  const job = await prisma.job.findUnique({ where: { id } });
  return job ? toAppJob(job) : null;
}
