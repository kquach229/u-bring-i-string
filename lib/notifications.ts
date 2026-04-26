import type { Job } from "./types";
import nodemailer from "nodemailer";
import twilio from "twilio";

export async function sendBookingConfirmation(job: Job): Promise<void> {
  const subject = "U Bring I String booking confirmed";
  const message = `Hi ${job.customerName}, your booking is confirmed for ${new Date(
    job.requestedTime,
  ).toLocaleString()}.`;

  await Promise.all([
    sendEmailIfConfigured(job.customerEmail, subject, message),
    sendSmsIfConfigured(job.customerPhone, message),
  ]);
}

export async function sendReadyForPickupNotification(job: Job): Promise<void> {
  const subject = "U Bring I String: Ready for pickup";
  const message = `Hi ${job.customerName}, your racket is ready for pickup.`;

  await Promise.all([
    sendEmailIfConfigured(job.customerEmail, subject, message),
    sendSmsIfConfigured(job.customerPhone, message),
  ]);
}

async function sendEmailIfConfigured(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.NOTIFY_FROM_EMAIL;

  if (!host || !port || !user || !pass || !from) {
    console.info(`[notify:email:skipped] ${subject} -> ${to}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}

async function sendSmsIfConfigured(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.info(`[notify:sms:skipped] ${body} -> ${to}`);
    return;
  }

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    from: fromPhone,
    to,
    body,
  });
}
