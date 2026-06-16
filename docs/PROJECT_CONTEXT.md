# Shoebox Stories — Project Context

## What Is Shoebox Stories?

Shoebox Stories is a **photo scanning service** based in the **Dallas–Fort Worth (DFW)** area.
Customers bring (or will eventually mail) physical photos, and receive high-resolution digital scans organized and returned to them.

The business is currently **Initial Launch Phase**. The website is being developed before the first paying customers are onboarded.

---

## Service Area

- **Now**: Local DFW — customers drop off or arrange pickup in the Frisco/Plano area (primary zip: 75034).
- **Planned**: Mail-in service for customers outside DFW.

---

## Site Pages

| File | URL path | Purpose |
|------|----------|---------|
| `index.html` | `/` | Landing page — hero, how-it-works, what we scan, quality/before-after, testimonials, CTA |
| `pricing.html` | `/pricing` | Interactive pricing calculator with slider and volume tiers |
| `schedule.html` | `/schedule` | Appointment request form — calendar, time slots, estimate widget, contact form |

---

## Design System

### Colors (CSS custom properties in `assets/css/styles.css`)
| Token | Value | Used for |
|-------|-------|---------|
| `--brown` | `#3D2B1F` | Primary text, headings, logo |
| `--brown-light` | `#7A5C4A` | Secondary text, labels |
| `--warm-white` | `#FAF7F2` | Page backgrounds |
| `--sand` | `#EDE4D3` | Cards, dividers, borders |
| `--blush` | `#F2BBAD` | Accents, active nav underline |
| `--blush-dark` | `#D4866A` | Hover states, focus rings |
| `--coral-label` | `#C04A2B` | "Before" label, adjustment text |
| `--green-label` | `#2A6B3C` | "Included" badge, positive states |
| `--blue-label` | `#1B4F8A` | Info labels |
| `--gray-text` | `#9B8C82` | Muted/supporting text |

### Typography
- **Headings**: Nunito (Google Fonts) — weights 700, 800, 900
- **Body**: DM Sans (Google Fonts) — weights 400, 500

### Shared Stylesheets
All three pages link `assets/css/styles.css` for shared tokens, reset, nav, buttons, badges, and footer. Page-specific CSS lives in a `<style>` block inside each HTML file.

---

## Pricing Rules

All pricing constants live in `assets/js/config.js`.

| Constant | Value | Meaning |
|----------|-------|---------|
| `TAX_RATE` | 8.25% | Texas sales tax |
| `MINIMUM_ORDER` | $40.00 | Minimum billable before tax |
| `PICKUP_FEE` | $20.00 | Flat fee for pickup appointments |

### Volume Tiers
| Photos | Rate per photo |
|--------|---------------|
| 50–599 | $0.40 |
| 600–1,999 | $0.35 |
| 2,000+ | $0.30 |

Subtotal = qty × rate. If subtotal < $40, a minimum-order adjustment brings it up to $40. Tax is applied on (subtotal + pickup fee if any).

---

## Appointment Request Flow

1. **Customer** clicks **Get Started** / **Start Your Order** on the landing page (`index.html`), which links to `pricing.html#calculator`.
2. On `/pricing`, the customer uses the calculator to enter photo quantity and appointment options to see an estimate, then clicks **Schedule Now**, which links to `/schedule` with the estimate passed along as URL params (`schedule.html?quantity=...&type=...&albums=...`).
3. On `/schedule`, the customer picks a date and time from the calendar, fills out the contact form, and submits.
4. **Frontend** (`assets/js/schedule.js`) POSTs a JSON payload to `/api/appointment-request`.
5. **Cloudflare Pages Function** (`functions/api/appointment-request.js`) validates the request, authenticates with Google via a service-account JWT, and inserts a **TENTATIVE** event on the business Google Calendar (`shoeboxstories.scans@gmail.com`).
6. **Customer** receives a confirmation number on the page. The owner sees the tentative event in Google Calendar and confirms or declines manually.

> The calendar is currently **Phase 1 mock** — available slots are computed client-side from `AVAILABLE_TIME_SLOTS` in `config.js` without a live availability check.

---

## Local Development

### Prerequisites
- Node.js ≥ 18 (for Wrangler)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `npm install -g wrangler`

### Start the Dev Server
```bash
wrangler pages dev .
```
The site is served at `http://localhost:8788`. Cloudflare Pages Functions in `/functions` are also served.

### Environment Variables (Local)
Copy `.dev.vars.example` to `.dev.vars` and fill in the real values:
```
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_CALENDAR_ID=...
```
`.dev.vars` is git-ignored. **Never commit real credentials.**

### ⚠️ Path Sensitivity
Wrangler is strict about static file paths. Python's `http.server` tolerates URL-encoded spaces; Wrangler does not. All asset paths in HTML must exactly match the filesystem (e.g., `landing_page_imgs/` not `landing%20page%20imgs/`).

---

## Hosting

- **Platform**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Static files**: served from the repository root
- **Serverless functions**: `/functions/api/*.js` → available at `/api/*`
- **Secrets**: set in Cloudflare Pages dashboard → Settings → Environment Variables (not in code)

---

## File Structure

```
/
├── index.html               Landing page
├── pricing.html             Pricing calculator
├── schedule.html            Appointment request
├── assets/
│   ├── css/
│   │   └── styles.css       Shared CSS (tokens, nav, buttons, footer)
│   └── js/
│       ├── config.js        Editable business constants
│       ├── pricing.js       Pure pricing utility functions
│       └── schedule.js      Schedule page logic
├── landing_page_imgs/       Hero photos, before/after photos
├── functions/
│   └── api/
│       └── appointment-request.js   Cloudflare Pages Function
├── .dev.vars.example        Template for local secrets
├── .gitignore
└── docs/
    ├── PROJECT_CONTEXT.md   ← you are here
    └── API_CONTEXT.md       Backend / API reference
```
