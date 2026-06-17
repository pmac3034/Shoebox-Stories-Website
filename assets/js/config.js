/**
 * assets/js/config.js
 * Shoebox Stories — Editable Business Configuration
 *
 * All operator-facing constants live here.
 * Change pricing, tax, availability, and limits in this one file.
 * Loaded before pricing.js and schedule.js on every page that needs it.
 */

'use strict';

/* ── Pricing ──────────────────────────────────────────────────── */
const TAX_RATE           = 0.0825;   // 8.25% — update when local tax rate changes
const PICKUP_FEE         = 20.00;    // flat fee added for pickup appointments
const MINIMUM_ORDER      = 40.00;    // minimum billable amount before tax
const ALBUM_REMOVAL_FEE  = 25.00;    // per-album fee when photos need to be removed before scanning
const USB_DRIVE_FEE      = 25.00;    // flat fee for USB drive delivery of digitized files

/* ── Calculator UI ───────────────────────────────────────────── */
const SLIDER_MIN  = 50;     // minimum photos shown on slider
const SLIDER_MAX  = 5000;   // maximum photos shown on slider
const SLIDER_STEP = 25;     // slider increment
const DEFAULT_QTY = 250;    // starting quantity when page loads

/* ── Large Order ──────────────────────────────────────────────── */
// Orders above this quantity are directed to email for a custom quote.
// The slider hard-caps at SLIDER_MAX; manually typing above this value
// triggers a large-order notice instead of showing a standard estimate.
const LARGE_ORDER_THRESHOLD = 5000;
const LARGE_ORDER_EMAIL     = 'shoeboxstories.scans@gmail.com';

/**
 * Volume pricing tiers.
 * Tiers must be contiguous and ordered low-to-high.
 * Add or edit tiers here; pricing.js and schedule.js read this array.
 */
const PRICING_TIERS = [
  { min: 50,   max: 599,      rate: 0.40, label: '50–599 photos'    },
  { min: 600,  max: 1999,     rate: 0.35, label: '600–1,999 photos' },
  { min: 2000, max: Infinity, rate: 0.30, label: '2,000+ photos'    },
];

/* ── Availability ─────────────────────────────────────────────── */
const SERVICE_ZIP              = '75034';  // primary service zip code
const NOTICE_HOURS             = 24;       // minimum advance notice required
const BOOKING_WINDOW_DAYS      = 14;       // how many days ahead the calendar shows
const APPOINTMENT_DURATION_MIN = 15;       // length of each appointment slot (minutes)

/**
 * Available appointment times by day-of-week.
 * Keys: 0 = Sunday … 6 = Saturday.
 * Values: array of 'HH:MM' 24-hour time strings.
 * Remove a day key entirely to mark that day as unavailable.
 */
const AVAILABLE_TIME_SLOTS = {
  1: ['10:00', '13:00', '16:00'],   // Monday:    10 AM, 1 PM, 4 PM
  3: ['10:00', '13:00', '16:00'],   // Wednesday: 10 AM, 1 PM, 4 PM
  6: ['10:00', '13:00'],            // Saturday:  10 AM, 1 PM
};

/* ── localStorage ────────────────────────────────────────────── */
// Key used to persist pending slot requests across page refreshes.
const PENDING_SLOTS_KEY = 'shoebox_pending_slots';
