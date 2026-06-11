/**
 * assets/js/schedule.js
 * Shoebox Stories — Schedule Page Logic
 *
 * Handles: availability calendar, time slots, estimate widget,
 * form validation, request building, and appointment submission.
 *
 * Requires (loaded before this file):
 *   - assets/js/config.js   (constants)
 *   - assets/js/pricing.js  (getTier, calculateEstimate, fmt, clampQty, sliderFillPct)
 */

'use strict';


/* ══════════════════════════════════════════════════════════════
 * API ENDPOINT CONTRACTS
 *
 * The frontend calls two backend endpoints:
 *
 *   GET  /api/availability?date=YYYY-MM-DD   (Phase 2B — not yet implemented)
 *   POST /api/appointment-request            (Phase 2A — live)
 *
 * Google Calendar credentials MUST remain server-side only.
 * The frontend must never call Google APIs directly.
 *
 * ── Phase 1: localStorage mock for availability
 * ── Phase 2A: POST /api/appointment-request → Google Calendar (live)
 * ── Phase 2B: GET /api/availability → real calendar availability
 * ── Phase 3: Google Sheets row + email notifications
 * ── Phase 4: Admin approval flow
 * ══════════════════════════════════════════════════════════════ */

/**
 * GET /api/availability?date=YYYY-MM-DD
 *
 * Phase 1: Returns locally-filtered slots from AVAILABLE_TIME_SLOTS,
 * minus any slots pending in this browser's localStorage.
 *
 * Phase 2B (replace body): Call backend, which checks Google Calendar
 * and returns only open slots.
 *
 * @param {string} dateString — 'YYYY-MM-DD'
 * @returns {Promise<string[]>} available time strings ('HH:MM')
 */
async function fetchAvailableSlots(dateString) {
  // ── Phase 2B: uncomment to use real backend ──────────────────
  // const res  = await fetch(`/api/availability?date=${dateString}`);
  // if (!res.ok) throw new Error('Failed to fetch availability');
  // const data = await res.json();   // { date, availableSlots }
  // return data.availableSlots;
  // ────────────────────────────────────────────────────────────

  // ── Phase 1 fallback: local mock ────────────────────────────
  const date      = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const allSlots  = AVAILABLE_TIME_SLOTS[dayOfWeek] || [];
  const cutoff    = new Date(Date.now() + NOTICE_HOURS * 60 * 60 * 1000);

  return allSlots.filter(time => {
    const [h, m] = time.split(':').map(Number);
    const slotDt = new Date(date);
    slotDt.setHours(h, m, 0, 0);
    return slotDt > cutoff && !pendingSlots.has(`${dateString}T${time}`);
  });
}

/**
 * POST /api/appointment-request
 *
 * Phase 2A (live): POSTs to the Cloudflare Pages Function, which
 * validates the request and creates a TENTATIVE hold in Google Calendar.
 *
 * On success, also saves the slot to localStorage so this browser
 * session won't re-offer the same slot while awaiting confirmation.
 *
 * Request body shape: see buildRequest() below and API_CONTEXT.md.
 *
 * @param {Object} requestData — output of buildRequest()
 * @returns {Promise<{ success: true, requestNumber: string }>}
 */
async function submitAppointmentRequest(requestData) {
  const res = await fetch('/api/appointment-request', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(requestData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Submission failed — please try again or contact us.');
  }

  // Mark slot as pending locally so this session won't re-offer it
  const slotKey = `${requestData.appointment.date}T${requestData.appointment.time}`;
  savePendingSlot(slotKey);

  return data;   // { success: true, requestNumber }
}


/* ══════════════════════════════════════════════════════════════
 * PENDING SLOT MANAGEMENT (localStorage — this browser only)
 *
 * Prevents the same user from double-booking in the same session.
 * Does NOT prevent two different users from requesting the same slot.
 * Phase 2B (GET /api/availability) will provide real conflict detection.
 * ══════════════════════════════════════════════════════════════ */

function loadPendingSlots() {
  try {
    const raw = localStorage.getItem(PENDING_SLOTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/**
 * Adds a slot key to the in-memory Set and persists to localStorage.
 * @param {string} slotKey — 'YYYY-MM-DDTHH:MM'
 */
function savePendingSlot(slotKey) {
  pendingSlots.add(slotKey);
  try {
    localStorage.setItem(PENDING_SLOTS_KEY, JSON.stringify([...pendingSlots]));
  } catch {
    console.warn('localStorage unavailable; pending slot not persisted.');
  }
}

// Initialised once at load; mutated by savePendingSlot()
let pendingSlots = loadPendingSlots();


/* ══════════════════════════════════════════════════════════════
 * DATE / TIME HELPERS
 * ══════════════════════════════════════════════════════════════ */

/** Formats a Date as 'YYYY-MM-DD' in local time. */
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts a 24-hour time string to 12-hour display format.
 * e.g. '13:00' → '1:00 PM'
 */
function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Formats a Date as a human-readable string.
 * e.g. 'Monday, January 13'
 */
function formatDateLong(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

/**
 * Formats the calendar month header.
 * Returns 'January 2025' or 'January / February 2025' if the window spans two months.
 */
function formatCalendarHeader(days) {
  if (!days.length) return '';
  const opts       = { month: 'long', year: 'numeric' };
  const firstLabel = days[0].toLocaleDateString('en-US', opts);
  const lastLabel  = days[days.length - 1].toLocaleDateString('en-US', opts);
  return firstLabel === lastLabel ? firstLabel : `${firstLabel} / ${lastLabel}`;
}


/* ══════════════════════════════════════════════════════════════
 * CALENDAR / AVAILABILITY LOGIC
 * ══════════════════════════════════════════════════════════════ */

/**
 * Generates the full array of Date objects to display in the calendar grid.
 * Starts at the Sunday of the week containing tomorrow;
 * ends at the Saturday of the week containing (today + BOOKING_WINDOW_DAYS).
 *
 * @returns {{ days: Date[], minDate: Date, maxDate: Date }}
 */
function generateCalendarDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + BOOKING_WINDOW_DAYS);

  // Pad back to the Sunday of minDate's week
  const calStart = new Date(minDate);
  calStart.setDate(calStart.getDate() - calStart.getDay());

  // Pad forward to the Saturday of maxDate's week
  const calEnd = new Date(maxDate);
  calEnd.setDate(calEnd.getDate() + ((6 - calEnd.getDay() + 7) % 7));

  const days = [];
  const cur  = new Date(calStart);
  while (cur <= calEnd) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return { days, minDate, maxDate };
}

/**
 * Determines the display state of a calendar day cell.
 *
 * @param {Date} day
 * @param {Date} minDate
 * @param {Date} maxDate
 * @returns {'past'|'out-of-window'|'unavailable'|'available'|'all-pending'}
 */
function getDayState(day, minDate, maxDate) {
  const ts = day.getTime();
  if (ts < minDate.getTime()) return 'past';
  if (ts > maxDate.getTime()) return 'out-of-window';

  const slots = AVAILABLE_TIME_SLOTS[day.getDay()];
  if (!slots || slots.length === 0) return 'unavailable';

  const cutoff  = new Date(Date.now() + NOTICE_HOURS * 60 * 60 * 1000);
  const dateKey = toDateKey(day);

  const hasOpen = slots.some(time => {
    const [h, m] = time.split(':').map(Number);
    const slotDt = new Date(day);
    slotDt.setHours(h, m, 0, 0);
    return slotDt > cutoff && !pendingSlots.has(`${dateKey}T${time}`);
  });

  if (!hasOpen) {
    // Slots exist but all are pending or within the notice cutoff
    const anyFuture = slots.some(time => {
      const [h, m] = time.split(':').map(Number);
      const slotDt = new Date(day);
      slotDt.setHours(h, m, 0, 0);
      return slotDt > cutoff;
    });
    return anyFuture ? 'all-pending' : 'past';
  }

  return 'available';
}


/* ══════════════════════════════════════════════════════════════
 * REQUEST BUILDING
 * ══════════════════════════════════════════════════════════════ */

/** Generates a unique request number: SS-YYYYMMDD-XXXX */
function generateRequestNumber() {
  const date   = toDateKey(new Date()).replace(/-/g, '');
  const suffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `SS-${date}-${suffix}`;
}

/**
 * Assembles the full appointment request object.
 * This is the exact shape POSTed to /api/appointment-request.
 * See API_CONTEXT.md for the full field reference.
 *
 * @param {{ name, email, phone, contactMethod, appointmentType,
 *           pickupAddress, dateKey, time, qty, albumCount, includePickup, notes }} params
 * @returns {Object}
 */
function buildRequest({ name, email, phone, contactMethod, appointmentType,
                        pickupAddress, dateKey, time, qty, albumCount, includePickup, notes }) {
  const estimate      = calculateEstimate(qty, includePickup, albumCount || 0);
  const requestNumber = generateRequestNumber();

  return {
    requestNumber,
    timestamp: new Date().toISOString(),

    customer: {
      name,
      email,
      phone,
      preferredContact: contactMethod || 'not specified',
    },

    appointment: {
      type:          appointmentType,
      date:          dateKey,
      time,
      dateDisplay:   formatDateLong(new Date(dateKey + 'T00:00:00')),
      timeDisplay:   formatTime12(time),
      pickupAddress: appointmentType === 'pickup' ? pickupAddress : null,
    },

    estimate: {
      qty:           estimate.qty,
      tier:          estimate.tier.label,
      ratePerPhoto:  estimate.tier.rate,
      rawSubtotal:   +estimate.rawSubtotal.toFixed(2),
      minAdjustment: +estimate.minAdj.toFixed(2),
      svcSubtotal:   +estimate.svcSubtotal.toFixed(2),
      pickupFee:     +estimate.pickupFee.toFixed(2),
      albumCount:    estimate.albumCount,
      albumFee:      +estimate.albumFee.toFixed(2),
      taxRate:       TAX_RATE,
      tax:           +estimate.tax.toFixed(2),
      total:         +estimate.total.toFixed(2),
    },

    notes: notes || '',
  };
}


/* ══════════════════════════════════════════════════════════════
 * APPLICATION STATE
 * ══════════════════════════════════════════════════════════════ */
const state = {
  qty:             DEFAULT_QTY,
  albumCount:      0,         // number of albums needing removal
  appointmentType: null,      // 'dropoff' | 'pickup'
  lockedMode:      false,     // true when order was passed via URL params
  selectedDate:    null,      // Date object
  selectedDateKey: null,      // 'YYYY-MM-DD'
  selectedTime:    null,      // 'HH:MM'
};


/* ══════════════════════════════════════════════════════════════
 * DOM REFERENCES
 * ══════════════════════════════════════════════════════════════ */

// Locked order summary card
const orderSummaryCard    = document.getElementById('order-summary-card');
const orderSummaryRows    = document.getElementById('order-summary-rows');
const orderSummaryTotal   = document.getElementById('order-summary-total-val');
const orderEditLink       = document.getElementById('order-edit-link');

// Locked appointment type badge
const lockedApptType     = document.getElementById('locked-appt-type');
const lockedApptLabel    = document.getElementById('locked-appt-label');
const lockedApptEdit     = document.getElementById('locked-appt-edit');
const apptTypeRadioGroup = document.getElementById('appt-type-radio-group');


// Calendar
const calGrid           = document.getElementById('cal-grid');
const calMonthLabel     = document.getElementById('cal-month-label');
const timeslotsSection  = document.getElementById('timeslots-section');
const timeslotsLabel    = document.getElementById('timeslots-date-label');
const timeslotsGrid     = document.getElementById('timeslots-grid');

// Form
const appointmentForm    = document.getElementById('appointment-form');
const submitBtn          = document.getElementById('submit-btn');
const pickupAddressField = document.getElementById('pickup-address-field');
const dropoffNote        = document.getElementById('dropoff-note');
const selectionSummary   = document.getElementById('selection-summary');
const selectionMissing   = document.getElementById('selection-missing');
const sumDateTime        = document.getElementById('sum-date-time');
const sumType            = document.getElementById('sum-type');
const fPickupAddress     = document.getElementById('f-pickup-address');


/* ══════════════════════════════════════════════════════════════
 * UI UPDATE FUNCTIONS
 * ══════════════════════════════════════════════════════════════ */

/** Renders the full calendar grid (clears and rebuilds day cells). */
function renderCalendar() {
  const { days, minDate, maxDate } = generateCalendarDays();
  calMonthLabel.textContent = formatCalendarHeader(days);

  // Remove old day cells; leave the 7 header cells intact
  calGrid.querySelectorAll('.cal-day').forEach(el => el.remove());

  days.forEach(day => {
    const dayState = getDayState(day, minDate, maxDate);
    const dateKey  = toDateKey(day);
    const isToday  = dateKey === toDateKey(new Date());

    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.textContent = day.getDate();
    btn.classList.add('cal-day', dayState);
    if (isToday) btn.classList.add('today');
    if (state.selectedDateKey === dateKey) btn.classList.add('selected');
    btn.setAttribute('data-date', dateKey);
    btn.setAttribute('aria-label',
      formatDateLong(day) + (dayState === 'available' ? ' — available' : ' — unavailable'));
    btn.disabled = (dayState !== 'available');

    if (dayState === 'available') {
      btn.addEventListener('click', () => onDateSelect(day, dateKey, btn));
    }

    calGrid.appendChild(btn);
  });
}

/** Called when the user clicks an available calendar day. */
async function onDateSelect(day, dateKey, clickedBtn) {
  calGrid.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
  clickedBtn.classList.add('selected');

  state.selectedDate    = day;
  state.selectedDateKey = dateKey;
  state.selectedTime    = null;   // reset time when date changes

  updateSelectionSummary();
  updateSubmitButton();
  await renderTimeSlots(day, dateKey);
}

/** Renders time slot buttons for the selected date. */
async function renderTimeSlots(day, dateKey) {
  timeslotsSection.classList.remove('hidden');
  timeslotsLabel.textContent  = formatDateLong(day);
  timeslotsGrid.innerHTML     = '<span class="no-slots-msg">Loading availability…</span>';

  const available = await fetchAvailableSlots(dateKey);
  const allSlots  = AVAILABLE_TIME_SLOTS[day.getDay()] || [];

  timeslotsGrid.innerHTML = '';

  if (allSlots.length === 0) {
    timeslotsGrid.innerHTML = '<span class="no-slots-msg">No slots configured for this day.</span>';
    return;
  }

  allSlots.forEach(time => {
    const isPending  = !available.includes(time);
    const isSelected = state.selectedTime === time;

    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.textContent = formatTime12(time);
    btn.classList.add('time-slot-btn');
    btn.setAttribute('data-time', time);

    if (isPending) {
      btn.classList.add('pending');
      btn.disabled = true;
      btn.title    = 'This time is pending or unavailable';
    } else if (isSelected) {
      btn.classList.add('selected');
    }

    if (!isPending) {
      btn.addEventListener('click', () => onTimeSelect(time, btn));
    }

    timeslotsGrid.appendChild(btn);
  });
}

/** Called when the user clicks an available time slot button. */
function onTimeSelect(time, clickedBtn) {
  timeslotsGrid.querySelectorAll('.time-slot-btn.selected')
    .forEach(el => el.classList.remove('selected'));
  clickedBtn.classList.add('selected');
  state.selectedTime = time;
  updateSelectionSummary();
  updateSubmitButton();
}

/** Updates the selected-appointment summary bar in the form. */
function updateSelectionSummary() {
  if (state.selectedDate && state.selectedTime) {
    selectionSummary.classList.remove('hidden');
    selectionMissing.style.display = 'none';
    sumDateTime.textContent = formatDateLong(state.selectedDate) + ' at ' + formatTime12(state.selectedTime);
    sumType.textContent = state.appointmentType
      ? (state.appointmentType === 'pickup' ? '🚗 Pickup' : '🏠 Drop-off')
      : 'Type not selected';
  } else {
    selectionSummary.classList.add('hidden');
    selectionMissing.style.display = '';
  }
}

/** Enables the submit button only when date, time, and type are all chosen. */
function updateSubmitButton() {
  submitBtn.disabled = !(state.selectedDate && state.selectedTime && state.appointmentType);
}

/** Shows/hides conditional fields when the appointment type changes. */
function onAppointmentTypeChange(type) {
  state.appointmentType = type;

  document.querySelectorAll('#appt-type-group .radio-card')
    .forEach(el => el.classList.remove('selected'));
  const activeCard = document.getElementById(type === 'pickup' ? 'rc-pickup' : 'rc-dropoff');
  if (activeCard) activeCard.classList.add('selected');

  if (type === 'pickup') {
    pickupAddressField.classList.add('visible');
    dropoffNote.classList.remove('visible');
  } else {
    pickupAddressField.classList.remove('visible');
    dropoffNote.classList.add('visible');
  }

  updateSelectionSummary();
  updateSubmitButton();
}


/* ══════════════════════════════════════════════════════════════
 * FORM VALIDATION
 * ══════════════════════════════════════════════════════════════ */

/**
 * Validates one field and toggles its error state.
 * @param {HTMLElement} input  — the input/textarea element
 * @param {HTMLElement} errEl  — the sibling error message element
 * @param {Function}    testFn — returns true if the trimmed value is valid
 * @returns {boolean}
 */
function validateField(input, errEl, testFn) {
  const valid = testFn(input.value.trim());
  input.classList.toggle('error', !valid);
  errEl.style.display = valid ? 'none' : 'block';
  return valid;
}

/** Runs all validations. Returns true only if the entire form is valid. */
function validateForm() {
  let ok = true;

  if (!validateField(
    document.getElementById('f-name'),
    document.getElementById('err-name'),
    v => v.length >= 2
  )) ok = false;

  if (!validateField(
    document.getElementById('f-email'),
    document.getElementById('err-email'),
    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  )) ok = false;

  if (!validateField(
    document.getElementById('f-phone'),
    document.getElementById('err-phone'),
    v => v.replace(/\D/g, '').length >= 10
  )) ok = false;

  const apptTypeErr = document.getElementById('err-appt-type');
  // In locked mode, appointmentType is pre-set from URL — no need to validate radio
  if (!state.lockedMode && !state.appointmentType) {
    apptTypeErr.style.display = 'block';
    ok = false;
  } else {
    apptTypeErr.style.display = 'none';
  }

  if (state.appointmentType === 'pickup') {
    if (!validateField(
      fPickupAddress,
      document.getElementById('err-pickup-address'),
      v => v.length >= 5
    )) ok = false;
  }

  const dtErr = document.getElementById('err-datetime');
  if (!state.selectedDate || !state.selectedTime) {
    dtErr.style.display = 'block';
    ok = false;
  } else {
    dtErr.style.display = 'none';
  }

  return ok;
}


/* ══════════════════════════════════════════════════════════════
 * CONFIRMATION DISPLAY
 * ══════════════════════════════════════════════════════════════ */

/** Hides the booking section and shows the success confirmation. */
function showConfirmation(requestData) {
  document.getElementById('booking-section').style.display = 'none';
  document.getElementById('conf-request-num').textContent = requestData.requestNumber;

  const grid  = document.getElementById('conf-details-grid');
  const items = [
    { label: 'Date',        value: requestData.appointment.dateDisplay },
    { label: 'Time',        value: requestData.appointment.timeDisplay },
    { label: 'Type',        value: requestData.appointment.type === 'pickup' ? '🚗 Pickup' : '🏠 Drop-off' },
    { label: 'Est. Photos', value: requestData.estimate.qty.toLocaleString() },
    { label: 'Price Tier',  value: requestData.estimate.tier },
    { label: 'Est. Total',  value: fmt(requestData.estimate.total) },
  ];
  if (requestData.estimate.albumCount > 0) {
    const plural = requestData.estimate.albumCount === 1 ? '' : 's';
    items.splice(5, 0, {
      label: 'Album Removal',
      value: `${requestData.estimate.albumCount} album${plural} (+${fmt(requestData.estimate.albumFee)})`,
    });
  }

  grid.innerHTML = items.map(item => `
    <div class="confirm-detail-item">
      <div class="detail-label">${item.label}</div>
      <div class="detail-value">${item.value}</div>
    </div>
  `).join('');

  const pickupReminder = document.getElementById('conf-pickup-reminder');
  if (requestData.appointment.type === 'pickup') {
    pickupReminder.textContent = ' A $20 pickup fee is included in your estimate.';
  }

  const confirmSection = document.getElementById('confirmation-section');
  confirmSection.style.display = 'block';
  confirmSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ══════════════════════════════════════════════════════════════
 * EVENT LISTENERS
 * ══════════════════════════════════════════════════════════════ */

document.querySelectorAll('input[name="appointment-type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.checked) onAppointmentTypeChange(radio.value);
  });
});

document.querySelectorAll('input[name="contact-method"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('#contact-method-group .radio-card')
      .forEach(el => el.classList.remove('selected'));
    if (radio.checked) radio.closest('.radio-card').classList.add('selected');
  });
});

appointmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    const firstError = appointmentForm.querySelector('.error, [style*="display: block"]');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const name          = document.getElementById('f-name').value.trim();
  const email         = document.getElementById('f-email').value.trim();
  const phone         = document.getElementById('f-phone').value.trim();
  const contactMethod = document.querySelector('input[name="contact-method"]:checked')?.value || null;
  const pickupAddr    = fPickupAddress.value.trim();
  const notes         = document.getElementById('f-notes').value.trim();
  const includePickup = state.appointmentType === 'pickup';

  const requestData = buildRequest({
    name, email, phone, contactMethod,
    appointmentType: state.appointmentType,
    pickupAddress:   pickupAddr,
    dateKey:         state.selectedDateKey,
    time:            state.selectedTime,
    qty:             state.qty,
    albumCount:      state.albumCount,
    includePickup,
    notes,
  });

  console.log('=== APPOINTMENT REQUEST ===', JSON.stringify(requestData, null, 2));

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Submitting…';

  try {
    await submitAppointmentRequest(requestData);
    showConfirmation(requestData);
  } catch (err) {
    console.error('Submission error:', err);
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Request Appointment';
    alert('Something went wrong. Please try again or contact us directly.');
  }
});


/* ══════════════════════════════════════════════════════════════
 * LOCKED ORDER SUMMARY — rendered when URL has order params
 * ══════════════════════════════════════════════════════════════ */

/**
 * Builds the "edit order" back-link URL.
 * Points to pricing.html#calculator with the current params pre-filled.
 */
function buildEditOrderURL(qty, type, albums) {
  return `pricing.html?quantity=${qty}&type=${type}&albums=${albums}#calculator`;
}

/**
 * Renders the locked "Your Order" summary card in the left column.
 * Called once on page load when URL params are present.
 * @param {{ qty: number, type: string, albums: number }} params
 */
function renderOrderSummary({ qty, type, albums }) {
  const includePickup = type === 'pickup';
  const e = calculateEstimate(qty, includePickup, albums);

  // Build rows HTML
  const rows = [];

  rows.push({ label: 'Estimated photos', val: qty.toLocaleString(), badge: false });
  rows.push({ label: 'Pricing tier',      val: e.tier.label,          badge: true  });
  rows.push({ label: 'Rate per photo',    val: fmt(e.tier.rate) + '/photo', badge: false });
  rows.push({ label: 'Service subtotal',  val: fmt(e.rawSubtotal),    badge: false });

  if (e.minAdj > 0) {
    rows.push({ label: 'Minimum order adj.', val: '+' + fmt(e.minAdj),   badge: false, muted: true });
    rows.push({ label: 'Adjusted subtotal',  val: fmt(e.svcSubtotal),    badge: false });
  }

  if (includePickup) {
    rows.push({ label: 'Appointment type', val: '🚗 Pickup', badge: false });
    rows.push({ label: 'Pickup fee',       val: '+' + fmt(e.pickupFee), badge: false });
  } else {
    rows.push({ label: 'Appointment type', val: '🏠 Drop-off', badge: false });
  }

  if (albums > 0) {
    const plural = albums === 1 ? '' : 's';
    rows.push({ label: `Album removal (${albums} album${plural})`, val: '+' + fmt(e.albumFee), badge: false });
  }

  rows.push({ label: `Tax (${(TAX_RATE * 100).toFixed(2).replace(/\.?0+$/, '')}%)`, val: fmt(e.tax), badge: false });

  orderSummaryRows.innerHTML = rows.map(r => `
    <div class="order-summary-row">
      <span class="osr-label">${r.label}</span>
      ${r.badge
        ? `<span class="osr-badge">${r.val}</span>`
        : `<span class="osr-val" style="${r.muted ? 'color:var(--coral-label)' : ''}">${r.val}</span>`}
    </div>
  `).join('');

  orderSummaryTotal.textContent = fmt(e.total);

  // Set edit link
  orderEditLink.href = buildEditOrderURL(qty, type, albums);
}


/* ══════════════════════════════════════════════════════════════
 * URL PARAM READING — Option D entry point
 * ══════════════════════════════════════════════════════════════ */

/**
 * Reads ?quantity=, ?type=, and ?albums= from the URL.
 *
 * If all three (or at least quantity + type) are present and valid,
 * enters "locked mode":
 *  - Shows the locked order summary card (left column)
 *  - Hides the adjustable estimate widget
 *  - Hides the appointment type radio cards (pre-set from URL)
 *  - Shows the locked appointment type badge
 *  - Pre-sets state.appointmentType and state.qty / state.albumCount
 *
 * If params are absent or invalid, enters "fallback mode":
 *  - Shows the configure-first nudge + the adjustable estimate widget
 *  - Shows the appointment type radio cards
 */
function readOrderFromURL() {
  const params  = new URLSearchParams(window.location.search);
  const rawQty  = params.get('quantity');
  const rawType = params.get('type');
  const rawAlbums = params.get('albums');

  const qty    = parseInt(rawQty, 10);
  const albums = parseInt(rawAlbums, 10) || 0;
  const type   = (rawType === 'pickup' || rawType === 'dropoff') ? rawType : null;

  const hasValidParams = !isNaN(qty) && qty >= SLIDER_MIN && type !== null;

  if (hasValidParams) {
    // ── LOCKED MODE ────────────────────────────────────────────
    state.lockedMode    = true;
    state.qty           = qty <= LARGE_ORDER_THRESHOLD ? qty : qty;  // allow over-threshold in summary
    state.albumCount    = albums;
    state.appointmentType = type;

    // Render order summary card
    renderOrderSummary({ qty, type, albums });
    orderSummaryCard.classList.remove('hidden');

    // Show locked appt type badge; hide radio group
    const typeLabel = type === 'pickup' ? '🚗 Pickup (+$20 fee)' : '🏠 Drop-off';
    lockedApptLabel.textContent = typeLabel;
    const editURL = buildEditOrderURL(qty, type, albums);
    lockedApptEdit.href = editURL;
    lockedApptType.classList.add('visible');
    if (apptTypeRadioGroup) apptTypeRadioGroup.style.display = 'none';

    // Pre-set pickup/dropoff conditional fields
    onAppointmentTypeChange(type);

  } else {
    // No valid order params — send user to pricing page to configure first
    window.location.replace('pricing.html#calculator');
  }
}


/* ══════════════════════════════════════════════════════════════
 * INITIALIZE
 * ══════════════════════════════════════════════════════════════ */
(function init() {
  readOrderFromURL();
  renderCalendar();
})();
