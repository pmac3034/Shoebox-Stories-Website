# Shoebox Stories — UI Style Guide

---

## Overall Impression

The design radiates warmth, nostalgia, and gentle trustworthiness. A soft, airy palette of blush pinks, powder blues, and sand tones evokes the tactile feeling of old photographs and worn paper — exactly the emotional territory the product occupies. The layout is spacious and unhurried, with generous padding that lets content breathe. Alternating section backgrounds create a calm rhythm without ever feeling clinical or corporate. The overall mood is intimate and family-oriented: this is a brand that wants to feel like a trusted friend, not a tech startup.

---

## Color

| Role | Name | Hex | Usage |
|---|---|---|---|
| Surface / Background | Warm White | `#FEFCFA` | Page background, hero, quality section, card fill |
| Primary Dark | Brown | `#3D2B1F` | Body text, headings, button text, nav, mission section background, final CTA background |
| Primary Dark (lighter) | Brown Light | `#6B4C3B` | Secondary body text, step descriptions |
| Accent 1 | Blush | `#F2BBAD` | Primary CTA buttons, nav CTA, mission quote accent, section label backgrounds |
| Accent 1 (hover) | Blush Dark | `#F0A896` | Button hover state |
| Accent 2 | Powder Blue | `#B8D4E8` | Secondary CTA button, step cards, spec badges, quality step numbers |
| Surface 2 | Sand | `#E8D5C0` | Trust bar, testimonial section background |
| Surface 3 | Dark Navy | `#2C3E50` | "All Included" section background |
| Footer | Near Black Brown | `#2A1F18` | Footer background |
| Text Secondary | Gray Text | `#7A6B62` | Body paragraphs, captions, descriptions |
| Accent Label (coral) | Coral Label | `#C97A66` | Section label text (blush variant), attribution text |
| Accent Label (blue) | Blue Label | `#4A87AD` | Section label text (blue variant), spec pills |
| Light Cream | Off-White | `#FFF5EE` | Headings on dark backgrounds, footer logo |

Shadows are universally soft and warm-tinted: `rgba(61,43,31,0.10–0.18)` — brown-toned rather than neutral grey, reinforcing the earthy warmth of the palette.

---

## Typography

### Typefaces
- **Nunito** — used for all headings (`h1`–`h4`), logo, buttons, badges, labels, and quotes. A rounded, friendly sans-serif.
- **DM Sans** — used for body copy, navigation links, captions, and attributions. A clean, contemporary sans-serif.

### Size Hierarchy

| Level | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Display / H1 | Nunito | `clamp(48px, 5vw, 80px)` | 900 | Hero headline, `letter-spacing: -0.5px`, `line-height: 1.1` |
| H2 (large) | Nunito | `clamp(40px, 4vw, 60px)` | 900 | Section headers on dark backgrounds |
| H2 (standard) | Nunito | `clamp(36px, 3.5vw, 52px)` | 900 | Most section headers, `letter-spacing: -0.3px` |
| H2 (medium) | Nunito | `clamp(34px, 3.5vw, 48px)` | 900 | Quality section header |
| Quote / Pull | Nunito | `clamp(22px, 2.5vw, 34px)` | 700 italic | Testimonial, mission blockquote |
| Card Title | Nunito | `20–28px` | 800–900 | Step titles, digitize card titles |
| Section Label | Nunito | `11–12px` | 700–800 | Uppercase, `letter-spacing: 0.18–0.20em`, pill-shaped |
| Body | DM Sans | `15–17px` | 400 | `line-height: 1.65–1.75` |
| Small Body | DM Sans | `14–15px` | 400–500 | Captions, included item descriptions |
| Nav Links | DM Sans | `15px` | 500 | |
| Buttons | Nunito | `15–17px` | 700 | |
| Badges / Specs | Nunito | `12px` | 700 | `letter-spacing: 0.04–0.10em` |

---

## Spacing and Layout

### Spacing Scale (observed)
- **Micro:** `4–6px` (dot separators, small gaps)
- **Small:** `8–14px` (icon-text gaps, badge padding, tight stacks)
- **Medium:** `20–28px` (card padding increments, paragraph margins)
- **Large:** `32–40px` (grid gutters, section sub-element spacing)
- **XL:** `48–60px` (card padding, horizontal section padding)
- **2XL:** `70–80px` (section vertical padding increments)
- **3XL:** `100–110px` (full section top/bottom padding)

### Section Structure
- Sections alternate backgrounds deliberately: Warm White → Sand → Brown → White → Blush → Dark Navy → Warm White → Sand → Brown → Near-Black.
- Max content widths: `960px` (steps grid), `1100px` (digitize grid, included grid), `1200px` (mission, quality columns).
- The nav is `64px` tall, sticky, with `60px` horizontal padding, and a `1.5px` sand-colored bottom border.
- Two-column layouts use `gap: 80px` at full width, collapsing gracefully.
- The hero has `100px` top / `80px` bottom padding and is entirely center-aligned.

---

## Components

### Buttons

**Primary (Blush Pill)**
- Background: `#F2BBAD`; Text: `#3D2B1F`; Font: Nunito 700
- Padding: `15px 36px` (standard), `17px 48px` (large CTA)
- Border-radius: `999px` (full pill)
- Box shadow: `0 4px 16px rgba(242,187,173,0.5)`
- Hover: lifts `translateY(-3px)`, deeper shadow, darkens to `#F0A896`

**Secondary (Blue Pill)**
- Background: `#B8D4E8`; same shape and font as primary
- Box shadow: `0 4px 16px rgba(184,212,232,0.5)`
- Hover: lifts, deeper shadow, darkens to `#A3C6DE`

**Nav CTA**
- Smaller variant of Blush Pill: `10px 26px` padding, `15px` font

### Cards

**Step Cards**
- Background: Powder Blue `#B8D4E8`
- Border-radius: `22px`
- Padding: `44px 32px 38px`
- Box shadow: `0 8px 32px rgba(61,43,31,0.12)`
- Hover: `translateY(-6px)`, deeper shadow

**Digitize Cards**
- Background: Warm White `#FEFCFA`
- Border-radius: `24px`
- Padding: `48px 44px`
- Box shadow: `0 8px 32px rgba(61,43,31,0.10)`
- Hover: `translateY(-5px)`, deeper shadow

**Testimonial Card**
- Background: `rgba(255,255,255,0.5)` (semi-transparent on sand background)
- Border-radius: `28px`
- Padding: `56px 60px`
- Box shadow: `0 4px 24px rgba(61,43,31,0.08)`

### Section Labels / Overlines
- Pill-shaped inline badge: `6px 18px` padding, `border-radius: 999px`
- Font: Nunito 700–800, `11–12px`, uppercase, wide letter-spacing
- Color variants: blush background + coral text; blue background + blue text; subtle brown tint on blush section; cream outline on dark backgrounds

### Spec Badges
- Background: Powder Blue; Text: Brown; Font: Nunito 700 `12px`
- Padding: `5px 14px`; border-radius: `999px`
- Grouped in a flex row with `8px` gap

### Quality Step Numbers
- `44×44px` circle, Powder Blue fill, Brown text
- Font: Nunito 900 `18px`
- Box shadow: `0 4px 12px rgba(184,212,232,0.5)`

### Navigation
- Sticky, 64px height, warm-white background with sand bottom border
- Logo: Nunito 800, `22px`, brown
- Links: DM Sans 500, `15px`; hover fades to `opacity: 0.6`

### Trust Bar
- Sand-background strip with a semi-transparent white pill container
- Stats separated by small brown dots (`5px` circles, `opacity: 0.4`)

---

## Imagery and Iconography

**Photography (hero frames):** Vintage family photographs displayed as physical polaroid-style frames — white borders (`6px` solid `#fff`), slight rotation (ranging from `−8°` to `+9°`), drop shadows, and rounded corners (`6px`). The arrangement mimics photos casually spread on a table. Frame backgrounds use warm gradient placeholders (blush pinks, sand, soft blue) for loading states. On hover, frames scale up and snap to `0°` rotation.

**Before/After Panel:** The "Before" state uses a cross-hatched warm-brown gradient to simulate a faded, degraded print. The "After" state uses a clean warm-cream gradient. A white `3px` vertical divider separates the two panels. Both panels contain a lightly opaque emoji as a decorative placeholder icon.

**Icons/Emoji:** Throughout the page, large emoji characters (`44–52px`) serve as section and card icons — a deliberate, accessible, and friendly choice that avoids custom illustration overhead. They appear at consistent sizes and are always displayed on a single line with defined `line-height: 1`. Used in: step cards, included-items grid, digitize cards, nav and footer logos, and trust bar stats.

No photographic illustrations or custom SVG icons are present — the design relies entirely on emoji + CSS gradients for visual warmth.

---

## Voice and Tone

The copy is warm, emotionally direct, and conversational — more like a thoughtful letter from a friend than a sales pitch. It leans into universal sentiment (family, loss, time passing) without being heavy-handed. The tone is confident but never boastful; it reassures rather than pressures.

Vocabulary favors simple, human words over technical jargon. Where technical specs appear (DPI values, format names), they're contextualised with plain-English reassurance.

**Representative phrases:**

> *"The photos in that shoebox deserve better."*

> *"What if something happened to those photos?" — that fear ends today.*

> *"Handled like our own family's photos — every single time."*