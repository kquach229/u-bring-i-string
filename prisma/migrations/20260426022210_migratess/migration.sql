-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('DROPOFF', 'PICKUP_REQUEST', 'FLEXIBLE_QUEUE');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "contactPreference" "ContactPreference" NOT NULL,
    "appointmentMode" "AppointmentMode" NOT NULL,
    "requestedTime" TIMESTAMP(3) NOT NULL,
    "stringType" TEXT NOT NULL,
    "tension" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "statusTimeline" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
