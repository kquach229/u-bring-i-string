## U Bring I String

Tennis racket stringing appointment app built with Next.js.

### Features

- Customer booking form with:
  - Name
  - Contact info (email + phone + preferred method)
  - Drop-off or pickup request
  - Date/time slot
  - String type + tension
  - Notes
- Scheduling guardrails:
  - Working hour slots
  - Per-slot capacity limit
  - Daily booking cap
  - Flexible intake queue mode
- Job tracking:
  - Statuses: Pending, In Progress, Ready for Pickup, Completed
  - Status timeline timestamps
- Notifications (scaffolded):
  - Booking confirmation
  - Ready-for-pickup notification
- Admin dashboard:
  - View all jobs
  - Filter by status
  - One-click status updates
  - See daily workload

### Quick start

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for booking and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for admin.

### Data and notifications

- Bookings are stored in SQLite via Prisma (`prisma/schema.prisma`).
- Default local database path: `prisma/dev.db` (via `DATABASE_URL`).
- Notifications are wired for SMTP email + Twilio SMS in `lib/notifications.ts`.
- If credentials are missing, notifications safely log and skip.
- Copy `.env.example` to `.env.local` and fill in credentials.

### Production notes

- Move datasource from SQLite to Postgres/Supabase for multi-user production use.
- Add authentication for the dashboard.
- Add provider API keys via `.env.local` for real notifications.
- Add admin settings UI for editing hours, slot size, and limits without code changes.
