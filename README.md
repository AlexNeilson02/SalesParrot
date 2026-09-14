# SalesParrot 🦜

A mobile-friendly door-to-door sales tracking app. Add prospects as you knock
doors, jot notes the way you would in Notion, and let SalesParrot pick out
follow-up timing from what you type — "come back in spring", "call next
Tuesday", "check back in 2 weeks" — and surface it on a Today dashboard when
it's actually time to act.

## Features

- **Prospects** — track name, address, phone/email, and a sales-pipeline
  status (New, Not Home, Interested, Follow Up, Appointment, Sold, Not
  Interested).
- **Notes timeline** — a running, Notion-style log of notes per prospect.
- **Smart follow-up detection** — as you type a note, SalesParrot scans it
  for follow-up timing (relative dates, weekdays, explicit dates, and
  seasons like "spring"/"winter") and offers to schedule a reminder with one
  tap. You can also add reminders manually with quick-pick chips.
- **Today dashboard** — overdue / due today / this week / later, grouped by
  prospect, with one-tap call, text, email, or driving-directions shortcuts.
- **Installable PWA** — add it to your phone's home screen for a native-app
  feel while you're out on your route.

Reminders are surfaced in-app only — nothing is sent automatically on your
behalf. Tap the call/text/email/directions shortcut on a reminder to follow
up yourself.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript
- [Prisma](https://www.prisma.io) + SQLite
- Tailwind CSS
- [chrono-node](https://github.com/wanasit/chrono) for natural-language date
  parsing, plus a small custom parser for seasonal phrases
- Cookie-based session auth (`jose` + `bcryptjs`), no third-party auth
  provider required

## Getting started

```bash
npm install
cp .env.example .env   # then edit AUTH_SECRET (see below)
npx prisma migrate deploy
npm run db:seed        # optional demo data
npm run dev
```

Open http://localhost:3000 — you'll land on the login page.

If you ran `npm run db:seed`, you can log in with:

- **Email:** `demo@salesparrot.app`
- **Password:** `password123`

Otherwise, use **Create an account** to register your own login.

### Environment variables

| Variable       | Description                                                                 |
| -------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL` | SQLite connection string. Defaults to `file:./prisma/dev.db`.                 |
| `AUTH_SECRET`  | Secret used to sign session cookies. Generate one with `openssl rand -hex 32` and never commit it. |

## Project structure

```
prisma/schema.prisma        Data model (User, Prospect, Note, FollowUp)
prisma/seed.ts               Demo data
src/lib/reminders.ts         Natural-language + seasonal follow-up detection
src/lib/actions/             Server Actions (auth, prospects, notes/follow-ups)
src/app/(app)/               Authenticated app shell (dashboard, prospects, settings)
src/components/              NoteComposer, FollowUpItem, StatusPicker, etc.
```

## Extending follow-up automation

Follow-ups currently surface in-app only. If you later want SalesParrot to
actually send emails or texts for you, the natural extension points are:

1. Add SMTP (email) or a provider like Twilio (SMS) credentials via a
   settings page.
2. Add a scheduled job (cron, Vercel Cron, etc.) that queries
   `FollowUp` rows where `status = PENDING` and `dueAt <= now`, and sends
   through your provider of choice.
3. Mark the `FollowUp` as `DONE` (or a new `SENT` status) once delivered.

The `method` field on `FollowUp` (`IN_PERSON` / `PHONE` / `TEXT` / `EMAIL`)
already records how the rep wants to follow up, so automation can filter on
it directly.
