/**
 * assets/js/pricing.js
 * Shoebox Stories — Pricing Utility Functions
 *
 * Pure calculation helpers shared by pricing.html and schedule.html.
 * No DOM references. Requires config.js to be loaded first.
 */

'use strict';

/**
 * Returns the pricing tier object for a given photo quantity.
 * Falls back to the last tier if qty exceeds all defined maxes.
 * @param {number} qty
 * @returns {{ min: number, max: number, rate: number, label: string }}
 */
function getTier(qty) {
  return PRICING_TIERS.find(t => qty >= t.min && qty <= t.max)
      || PRICING_TIERS[PRICING_TIERS.length - 1];
}

/**
 * Calculates a full price estimate for a given quantity.
 * Applies the minimum order adjustment, optional pickup fee, and album removal fee.
 *
 * @param {number}  qty            — number of photos
 * @param {boolean} includePickup  — whether to add the pickup fee
 * @param {number}  albumCount     — number of albums needing photo removal (default 0)
 * @returns {{
 *   qty: number, tier: object,
 *   rawSubtotal: number, minAdj: number, svcSubtotal: number,
 *   pickupFee: number, albumCount: number, albumFee: number,
 *   taxable: number, tax: number, total: number
 * }}
 */
function calculateEstimate(qty, includePickup = false, albumCount = 0) {
  const tier        = getTier(qty);
  const rawSubtotal = qty * tier.rate;
  const minAdj      = Math.max(0, MINIMUM_ORDER - rawSubtotal);
  const svcSubtotal = rawSubtotal + minAdj;   // = Math.max(rawSubtotal, MINIMUM_ORDER)
  const pickupFee   = includePickup ? PICKUP_FEE : 0;
  const albumFee    = albumCount * ALBUM_REMOVAL_FEE;
  const taxable     = svcSubtotal + pickupFee + albumFee;
  const tax         = taxable * TAX_RATE;
  const total       = taxable + tax;
  return { qty, tier, rawSubtotal, minAdj, svcSubtotal, pickupFee, albumCount, albumFee, taxable, tax, total };
}

/**
 * Formats a number as a USD dollar string.
 * e.g. 12.5 → '$12.50'
 * @param {number} n
 * @returns {string}
 */
function fmt(n) {
  return '$' + n.toFixed(2);
}

/**
 * Clamps a quantity to the valid slider range, snapping to the nearest step.
 * @param {number} val
 * @returns {number}
 */
function clampQty(val) {
  const clamped = Math.min(Math.max(val, SLIDER_MIN), SLIDER_MAX);
  return Math.round(clamped / SLIDER_STEP) * SLIDER_STEP;
}

/**
 * Returns the slider fill percentage (0–100) for a given value.
 * Used to set the CSS --fill custom property on the range input.
 * @param {number} val
 * @returns {number}
 */
function sliderFillPct(val) {
  return ((val - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
}
