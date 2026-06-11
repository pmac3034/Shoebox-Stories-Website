/**
 * POST /api/appointment-request
 *
 * Cloudflare Pages Function — Phase 2A
 *
 * Receives an appointment request from the frontend, validates it,
 * then creates a TENTATIVE hold event in Google Calendar using
 * server-to-server OAuth (service account JWT — no user login required).
 *
 * Required environment variables (set in Cloudflare dashboard or .dev.vars):
 *   GOOGLE_CLIENT_EMAIL  — service account email
 *   GOOGLE_PRIVATE_KEY   — full PEM private key (RSA, PKCS#8 or PKCS#1)
 *   GOOGLE_CALENDAR_ID   — target calendar ID (e.g. the business Gmail address)
 *
 * Request body shape (see schedule.html buildRequest() output):
 * {
 *   requestNumber: "SS-YYYYMMDD-XXXX",
 *   timestamp:     "ISO 8601",
 *   customer: {
 *     name:             string,
 *     email:            string,
 *     phone:            string,
 *     preferredContact: "email" | "phone" | "not specified"
 *   },
 *   appointment: {
 *     type:          "dropoff" | "pickup",
 *     date:          "YYYY-MM-DD",
 *     time:          "HH:MM",
 *     dateDisplay:   string,
 *     timeDisplay:   string,
 *     pickupAddress: string | null
 *   },
 *   estimate: {
 *     qty:           number,
 *     tier:          string,
 *     ratePerPhoto:  number,
 *     rawSubtotal:   number,
 *     minAdjustment: number,
 *     svcSubtotal:   number,
 *     pickupFee:     number,
 *     albumCount:    number,
 *     albumFee:      number,
 *     taxRate:       number,
 *     tax:           number,
 *     total:         number
 *   },
 *   notes: string
 * }
 *
 * Success response: { success: true, requestNumber: string }
 * Error response:   { success: false, error: string }
 */

// Appointment duration in minutes — keep in sync with schedule.html constant
const APPOINTMENT_DURATION_MIN = 15;


/* ══════════════════════════════════════════════════════════════════════════════
 * EMAIL NOTIFICATION (Resend)
 * Sends a plain-text summary to the business inbox after a calendar hold is
 * created. Requires RESEND_API_KEY and NOTIFY_EMAIL in environment variables.
 * Failure is non-fatal — the appointment request still succeeds.
 * ══════════════════════════════════════════════════════════════════════════════ */

async function sendAppointmentNotification(env, appointment) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) {
    console.warn('[appointment-request] Missing RESEND_API_KEY or NOTIFY_EMAIL — skipping email notification.');
    return;
  }

  const {
    requestNumber,
    name,
    email,
    phone,
    preferredContact,
    date,
    time,
    appointmentType,
    pickupAddress,
    qty,
    tier,
    albumCount,
    albumFee,
    pickupFee,
    estimatedTotal,
    notes,
  } = appointment;

  const subject = `New appointment request from ${name || 'customer'} — ${requestNumber}`;

  const lines = [
    `New appointment request submitted — ${requestNumber}`,
    '',
    `Name:            ${name || ''}`,
    `Email:           ${email || ''}`,
    `Phone:           ${phone || ''}`,
    `Preferred contact: ${preferredContact || ''}`,
    '',
    `Date:            ${date || ''}`,
    `Time:            ${time || ''}`,
    `Appointment type: ${appointmentType === 'pickup' ? 'Pickup' : 'Drop-off'}`,
  ];

  if (appointmentType === 'pickup' && pickupAddress) {
    lines.push(`Pickup address:  ${pickupAddress}`);
  }

  lines.push(
    '',
    `Estimated photos: ${qty || ''}`,
    `Pricing tier:     ${tier || ''}`,
  );

  if (albumCount > 0) {
    lines.push(`Album removal:   ${albumCount} album${albumCount === 1 ? '' : 's'} (+$${albumFee.toFixed(2)})`);
  }
  if (pickupFee > 0) {
    lines.push(`Pickup fee:      +$${pickupFee.toFixed(2)}`);
  }

  lines.push(
    `Estimated total: ${estimatedTotal || ''}`,
    '',
    'Notes:',
    notes || '(none)',
    '',
    'A TENTATIVE hold was created on your Google Calendar.',
  );

  const fromAddress = env.RESEND_FROM || 'Shoebox Stories <appointments@shoeboxstories.net>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [env.NOTIFY_EMAIL],
      subject,
      text: lines.join('\n'),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(no body)');
    console.error(`[appointment-request] Resend error (HTTP ${response.status}):`, errorText);
    console.error(`[appointment-request] from="${fromAddress}" to="${env.NOTIFY_EMAIL}"`);
  } else {
    console.log(`[appointment-request] Notification email sent → ${env.NOTIFY_EMAIL}`);
  }
}


export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // ── 1. Parse request body ─────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON in request body', 400, headers);
    }

    // ── 2. Validate required fields ───────────────────────────────────
    const validationError = validateRequest(body);
    if (validationError) {
      return jsonError(validationError, 422, headers);
    }

    // ── 3. Check environment variables ────────────────────────────────
    const clientEmail = env.GOOGLE_CLIENT_EMAIL;
    const privateKey  = env.GOOGLE_PRIVATE_KEY;
    const calendarId  = env.GOOGLE_CALENDAR_ID;

    if (!clientEmail || !privateKey || !calendarId) {
      console.error('[appointment-request] Missing Google credentials in environment');
      return jsonError('Server configuration error — please contact us directly.', 503, headers);
    }

    // ── 4. Get Google OAuth access token ─────────────────────────────
    let accessToken;
    try {
      accessToken = await getGoogleAccessToken(clientEmail, privateKey);
    } catch (err) {
      console.error('[appointment-request] OAuth token error:', err.message);
      return jsonError('Calendar service unavailable — please try again or contact us.', 503, headers);
    }

    // ── 5. Build and insert the Google Calendar event ─────────────────
    const event = buildCalendarEvent(body);
    let calendarResponse;
    try {
      calendarResponse = await insertCalendarEvent(calendarId, event, accessToken);
    } catch (err) {
      console.error('[appointment-request] Calendar insert error:', err.message);
      return jsonError('Could not create calendar hold — please try again or contact us.', 503, headers);
    }

    console.log(
      `[appointment-request] Created event "${calendarResponse.id}" for` +
      ` ${body.requestNumber} (${body.appointment.date} ${body.appointment.time})`
    );

    // ── 6. Send email notification (non-fatal) ────────────────────────
    await sendAppointmentNotification(env, {
      requestNumber:   body.requestNumber,
      name:            body.customer.name,
      email:           body.customer.email,
      phone:           body.customer.phone,
      preferredContact: body.customer.preferredContact,
      date:            body.appointment.dateDisplay,
      time:            body.appointment.timeDisplay,
      appointmentType: body.appointment.type,
      pickupAddress:   body.appointment.pickupAddress,
      qty:             body.estimate.qty,
      tier:            body.estimate.tier,
      albumCount:      body.estimate.albumCount || 0,
      albumFee:        body.estimate.albumFee   || 0,
      pickupFee:       body.estimate.pickupFee  || 0,
      estimatedTotal:  `$${body.estimate.total.toFixed(2)}`,
      notes:           body.notes,
    });

    // ── 7. Return success ─────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, requestNumber: body.requestNumber }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('[appointment-request] Unexpected error:', err);
    return jsonError('Unexpected server error — please try again or contact us.', 500, headers);
  }
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


/* ══════════════════════════════════════════════════════════════════════════════
 * VALIDATION
 * ══════════════════════════════════════════════════════════════════════════════ */

function validateRequest(body) {
  if (!body || typeof body !== 'object') return 'Request body is required.';

  const { requestNumber, customer, appointment, estimate } = body;

  if (!requestNumber || typeof requestNumber !== 'string') return 'Missing requestNumber.';

  // Customer fields
  if (!customer)                       return 'Missing customer object.';
  if (!customer.name?.trim())          return 'Customer name is required.';
  if (!customer.email?.trim())         return 'Customer email is required.';
  if (!isValidEmail(customer.email))   return 'Customer email is not valid.';
  if (!customer.phone?.trim())         return 'Customer phone is required.';

  // Appointment fields
  if (!appointment)                    return 'Missing appointment object.';
  if (!appointment.date)               return 'Appointment date is required.';
  if (!appointment.time)               return 'Appointment time is required.';
  if (!['dropoff', 'pickup'].includes(appointment.type))
    return 'Appointment type must be "dropoff" or "pickup".';
  if (appointment.type === 'pickup' && !appointment.pickupAddress?.trim())
    return 'Pickup address is required for pickup appointments.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment.date))
    return 'Appointment date must be in YYYY-MM-DD format.';
  if (!/^\d{2}:\d{2}$/.test(appointment.time))
    return 'Appointment time must be in HH:MM format.';

  // Estimate
  if (!estimate) return 'Missing estimate object.';
  if (!Number.isFinite(estimate.qty) || estimate.qty < 1)
    return 'Estimate quantity must be a positive number.';

  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ══════════════════════════════════════════════════════════════════════════════
 * GOOGLE CALENDAR EVENT BUILDER
 * ══════════════════════════════════════════════════════════════════════════════ */

function buildCalendarEvent(body) {
  const { requestNumber, customer, appointment, estimate, notes } = body;
  const { start, end } = buildDateTime(appointment.date, appointment.time);

  const typeLabel = appointment.type === 'pickup' ? 'Pickup' : 'Drop-off';

  const descLines = [
    `Request #: ${requestNumber}`,
    `Name:      ${customer.name}`,
    `Email:     ${customer.email}`,
    `Phone:     ${customer.phone}`,
    `Contact:   ${customer.preferredContact}`,
    ``,
    `Type:      ${typeLabel}`,
  ];
  if (appointment.type === 'pickup') {
    descLines.push(`Address:   ${appointment.pickupAddress}`);
  }
  descLines.push(
    ``,
    `Photos:    ${estimate.qty} (${estimate.tier})`,
    `Rate:      $${estimate.ratePerPhoto.toFixed(2)}/photo`,
    `Subtotal:  $${estimate.svcSubtotal.toFixed(2)}`,
  );
  if (estimate.pickupFee > 0) {
    descLines.push(`Pickup:    $${estimate.pickupFee.toFixed(2)}`);
  }
  if (estimate.albumCount > 0) {
    descLines.push(`Albums:    ${estimate.albumCount} album${estimate.albumCount === 1 ? '' : 's'} — $${estimate.albumFee.toFixed(2)}`);
  }
  descLines.push(
    `Tax:       $${estimate.tax.toFixed(2)}`,
    `Total:     $${estimate.total.toFixed(2)}`,
  );
  if (notes) {
    descLines.push(``, `Notes:     ${notes}`);
  }

  return {
    summary: `📷 ${typeLabel} — ${customer.name} (${estimate.qty} photos${estimate.albumCount > 0 ? `, ${estimate.albumCount} album${estimate.albumCount === 1 ? '' : 's'}` : ''})`,
    description: descLines.join('\n'),
    start: { dateTime: start, timeZone: 'America/Chicago' },
    end:   { dateTime: end,   timeZone: 'America/Chicago' },
    status: 'tentative',
    colorId: '5',   // banana yellow — easy to spot as pending
    extendedProperties: {
      private: {
        requestNumber,
        customerEmail:   customer.email,
        customerPhone:   customer.phone,
        appointmentType: appointment.type,
        estimatedTotal:  String(estimate.total),
        submittedAt:     body.timestamp || new Date().toISOString(),
      },
    },
  };
}

/**
 * Returns ISO 8601 start/end strings for the event (naive local time).
 * Google Calendar interprets them in the timeZone set on the event resource.
 */
function buildDateTime(dateKey, time24) {
  const [h, m] = time24.split(':').map(Number);
  const pad = n => String(n).padStart(2, '0');

  const startStr = `${dateKey}T${pad(h)}:${pad(m)}:00`;
  const totalEndMin = h * 60 + m + APPOINTMENT_DURATION_MIN;
  const endH = Math.floor(totalEndMin / 60);
  const endM = totalEndMin % 60;
  const endStr = `${dateKey}T${pad(endH)}:${pad(endM)}:00`;

  return { start: startStr, end: endStr };
}


/* ══════════════════════════════════════════════════════════════════════════════
 * GOOGLE CALENDAR API CALL
 * ══════════════════════════════════════════════════════════════════════════════ */

async function insertCalendarEvent(calendarId, event, accessToken) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '(no body)');
    throw new Error(`Google Calendar API ${res.status}: ${errText}`);
  }

  return res.json();
}


/* ══════════════════════════════════════════════════════════════════════════════
 * GOOGLE SERVICE ACCOUNT JWT + OAUTH TOKEN
 * Uses crypto.subtle (available in Cloudflare Workers) — no dependencies.
 * ══════════════════════════════════════════════════════════════════════════════ */

async function getGoogleAccessToken(clientEmail, privateKeyPem) {
  const scope = 'https://www.googleapis.com/auth/calendar.events';
  const now   = Math.floor(Date.now() / 1000);

  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   clientEmail,
    scope: scope,
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  const encHeader  = base64urlEncode(JSON.stringify(header));
  const encPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;

  const cryptoKey = await importRsaPrivateKey(privateKeyPem);

  const signatureBytes = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const encSignature = base64urlEncode(signatureBytes);
  const jwt = `${signingInput}.${encSignature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '(no body)');
    throw new Error(`OAuth token exchange ${tokenRes.status}: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('OAuth response missing access_token');
  }

  return tokenData.access_token;
}

/**
 * Imports a PEM RSA private key for crypto.subtle.
 * Handles both PKCS#8 ("BEGIN PRIVATE KEY") and PKCS#1 ("BEGIN RSA PRIVATE KEY").
 * Also handles Cloudflare env var line endings stored as literal \n.
 */
async function importRsaPrivateKey(pem) {
  // Cloudflare stores secrets with literal \n — normalize to real newlines
  const normalized = pem.replace(/\\n/g, '\n');
  const isPkcs8 = normalized.includes('BEGIN PRIVATE KEY');

  const b64 = normalized
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const derBytes = base64Decode(b64);

  if (isPkcs8) {
    return crypto.subtle.importKey(
      'pkcs8',
      derBytes,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }

  // PKCS#1 — wrap in a PKCS#8 container before importing
  const pkcs8Der = wrapPkcs1InPkcs8(derBytes);
  return crypto.subtle.importKey(
    'pkcs8',
    pkcs8Der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/**
 * Wraps a PKCS#1 RSA private key DER buffer in a minimal PKCS#8 envelope
 * so that crypto.subtle.importKey('pkcs8', ...) can accept it.
 */
function wrapPkcs1InPkcs8(pkcs1Der) {
  const key = new Uint8Array(pkcs1Der);

  // RSA OID algorithm identifier sequence
  const algId = new Uint8Array([
    0x30, 0x0d,
      0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
      0x05, 0x00,
  ]);

  // OCTET STRING wrapping the PKCS#1 key
  const octetLen = derLen(key.length);
  const octetHdr = new Uint8Array([0x04, ...octetLen]);

  // Version INTEGER 0
  const version = new Uint8Array([0x02, 0x01, 0x00]);

  // Outer SEQUENCE content
  const innerLen = version.length + algId.length + octetHdr.length + key.length;
  const outerHdr = new Uint8Array([0x30, ...derLen(innerLen)]);

  const result = new Uint8Array(outerHdr.length + innerLen);
  let off = 0;
  for (const chunk of [outerHdr, version, algId, octetHdr, key]) {
    result.set(chunk, off);
    off += chunk.length;
  }
  return result.buffer;
}

function derLen(n) {
  if (n < 0x80)   return [n];
  if (n < 0x100)  return [0x81, n];
  return [0x82, (n >> 8) & 0xff, n & 0xff];
}


/* ══════════════════════════════════════════════════════════════════════════════
 * BASE64 / BASE64URL HELPERS
 * ══════════════════════════════════════════════════════════════════════════════ */

function base64urlEncode(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64Decode(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}


/* ══════════════════════════════════════════════════════════════════════════════
 * RESPONSE HELPERS
 * ══════════════════════════════════════════════════════════════════════════════ */

function jsonError(message, status, headers) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers }
  );
}

// export async function onRequest(context) {
//   return new Response(
//     JSON.stringify({
//       success: true,
//       message: "Function route is working",
//       methodReceived: context.request.method,
//       url: context.request.url
//     }),
//     {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json"
//       }
//     }
//   );
// }