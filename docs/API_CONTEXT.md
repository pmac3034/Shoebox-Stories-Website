# Shoebox Stories — API & Backend Context

## Overview

The backend is a single **Cloudflare Pages Function** that receives appointment requests from the frontend and writes a tentative event to the business Google Calendar.

There are no databases, no user accounts, and no authentication required from the customer.

---

## Cloudflare Pages Functions

Functions live in `/functions/api/` and are automatically mapped to `/api/*` routes by Cloudflare Pages.

| File | Route | Method | Purpose |
|------|-------|--------|---------|
| `functions/api/appointment-request.js` | `POST /api/appointment-request` | POST | Create a tentative Google Calendar event |

Functions use the [Workers Runtime](https://developers.cloudflare.com/workers/runtime-apis/) — standard Web APIs (`fetch`, `crypto.subtle`, `Request`, `Response`). No Node.js built-ins.

---

## `POST /api/appointment-request`

### Request Body (JSON)

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-123-4567",
  "date": "2025-08-15",
  "time": "10:00",
  "quantity": 250,
  "pickupRequested": false,
  "estimatedTotal": 107.19,
  "notes": "Optional free-text notes from the customer"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Customer full name |
| `email` | string | ✅ | Contact email |
| `phone` | string | ✅ | Contact phone |
| `date` | string | ✅ | ISO date `YYYY-MM-DD` |
| `time` | string | ✅ | 24-hour `HH:MM` |
| `quantity` | number | ✅ | Number of photos (50–7500) |
| `pickupRequested` | boolean | ✅ | Whether customer wants pickup service |
| `estimatedTotal` | number | ✅ | Pre-tax+tax total calculated client-side |
| `notes` | string | — | Optional customer notes |

### Response (success)

```json
{
  "success": true,
  "requestNumber": "SS-20250815-A3F2"
}
```

### Response (error)

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

HTTP status codes: `200` on success, `400` for validation errors, `405` for wrong method, `500` for server errors.

---

## Google Calendar Integration

### How It Works

The function uses **server-to-server OAuth** with a Google **service account** — no user login required. The service account has been granted write access to the business calendar.

Flow:
1. Build a JWT signed with the service account's RSA private key (`RS256` via `crypto.subtle`).
2. Exchange the JWT for a short-lived OAuth access token from `https://oauth2.googleapis.com/token`.
3. Call `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events` with the token to insert a `TENTATIVE` event.

The event description includes customer name, email, phone, photo quantity, estimated total, and any notes.

### PKCS#1 vs PKCS#8

Google service account private keys export as PKCS#1 (-----BEGIN RSA PRIVATE KEY-----). The Workers `crypto.subtle` API only accepts **PKCS#8**. The function includes a `wrapPkcs1InPkcs8()` helper that manually wraps the DER-encoded key in a PKCS#8 envelope before importing.

If the key is already PKCS#8 (-----BEGIN PRIVATE KEY-----), it is imported directly.

---

## Required Environment Variables

Set these in **Cloudflare Pages → Settings → Environment Variables** (production) and in `.dev.vars` (local development). **Never put these in frontend code or commit them to git.**

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_EMAIL` | Service account email, e.g. `shoebox-calendar@project-id.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | RSA private key from the service account JSON. Replace literal `\n` with actual newlines, or the function handles `\\n` literals automatically. |
| `GOOGLE_CALENDAR_ID` | Google Calendar ID to write events to. For the primary calendar this is the owner's email: `shoeboxstories.scans@gmail.com` |

### Setting Up a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → IAM & Admin → Service Accounts.
2. Create a new service account (e.g. `shoebox-calendar`).
3. Under Keys, create a JSON key and download it.
4. Copy `client_email` → `GOOGLE_CLIENT_EMAIL`.
5. Copy `private_key` → `GOOGLE_PRIVATE_KEY` (the entire PEM string including `-----BEGIN...-----` markers).
6. In Google Calendar, share the calendar with the service account email and grant **"Make changes to events"** permission.

---

## Local Development

```bash
# Copy and fill in real values
cp .dev.vars.example .dev.vars

# Start dev server (serves both static files and functions)
wrangler pages dev .
```

Wrangler reads `.dev.vars` automatically and injects variables into the function's `env` context.

Test the endpoint:
```bash
curl -X POST http://localhost:8788/api/appointment-request \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"555-0000","date":"2025-08-15","time":"10:00","quantity":100,"pickupRequested":false,"estimatedTotal":43.30}'
```

---

## Planned Future Phases

### Phase 2B — Live Availability Check
Add a `GET /api/available-slots?start=YYYY-MM-DD&end=YYYY-MM-DD` endpoint that queries existing Google Calendar events and returns which configured slots are still open.

Currently the frontend computes availability purely from `AVAILABLE_TIME_SLOTS` in `config.js` with no knowledge of already-booked slots.

### Phase 3 — Google Sheets Logging
On each successful appointment request, append a row to a Google Sheet for easy tracking without opening Google Calendar. Uses the Sheets API with the same service account.

### Phase 4 — Email Notifications
Send a confirmation email to the customer and a notification email to the owner on each request. Options: SendGrid, Mailgun, or Cloudflare Email Workers.

### Phase 5 — Admin Approval Flow
Owner clicks "Approve" or "Decline" in their email. Clicking triggers a Cloudflare Function that updates the Calendar event status (`CONFIRMED` or `CANCELLED`) and sends a follow-up email to the customer.

---

## Security Notes

- Google credentials are **only** accessible server-side in Cloudflare Functions via `env`.
- The frontend never calls Google APIs directly.
- The frontend never receives or stores credentials.
- Request numbers (`SS-YYYYMMDD-XXXX`) are generated server-side and are not sequential to avoid enumeration.
- All inputs are validated server-side before the Calendar API is called.
