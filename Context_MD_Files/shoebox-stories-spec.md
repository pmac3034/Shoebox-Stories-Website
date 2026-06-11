# Shoebox Stories – Product Requirements Document

---

## Overview

Shoebox Stories is a pickup/dropoff photo digitization service targeting individuals and families who have collections of physical photographs they wish to preserve. Customers dropoff their physical media to Shoebox Stories, which professionally scans, enhances, and delivers high-resolution digital files via a secure download link, then returns every original item safely by mail. The service addresses the risk of permanent memory loss from physical media degradation, damage, or disaster by creating durable digital archives accessible to the whole family.

---

## Features

- **Mail-In Submission**
  Customers pack their physical media and ship it to Shoebox Stories using a prepaid shipping label provided by the service. No drop-off required.

- **Photo Scanning**
  Prints up to 8.5×11" — color, black-and-white, and all eras — are scanned at 600 DPI.

- **Slide Scanning**
  Standard 2×2" mounted slides in 110, 126, 127, half-135, 135 (35mm), and 828 formats are scanned at 4,000 DPI, whether mounted or loose.

- **Negative Scanning**
  Film negatives in 35mm, 110, APS, 135, 126, 127, and 120 formats — strip or cut — are scanned at 4,000 DPI.

- **Film and Video Transfer**
  Super 8, 8mm, and 16mm film reels, plus VHS, Hi8, Digital8, and MiniDV tapes, are transferred and output as digital MP4 files.

- **Color Correction**
  Faded or yellowed tones are restored per scan; colors are corrected to appear true-to-life rather than over-processed.

- **AI Denoise and Sharpen**
  AI-powered processing reduces grain and noise, and sharpens fine detail in each scan.

- **Dust Removal**
  Each image is processed to reduce specks and spots accumulated during storage.

- **Back-of-Photo Scanning**
  Handwritten notes, dates, and names on the reverse side of photos are captured at no additional charge.

- **Order Preservation**
  Scans are kept in the exact order the customer sends them, bundled by size group.

- **Folder Organization**
  Delivered digital files are organized into clearly labeled folders by media type.

- **Auto-Rotation**
  Every scanned image is correctly oriented in the final delivery — no sideways or inverted images.

- **Secure Digital Delivery**
  Completed scans are delivered via a private, secure download link accessible to the customer.

- **Original Return**
  Every original physical item is packaged and returned to the customer's door; shipment is insured and tracked.

- **Human Quality Review**
  A team member reviews every scan in an order before delivery, not merely a sample.

- **Before/After Quality Showcase**
  The marketing page displays a side-by-side before/after comparison illustrating the enhancement pipeline applied to scans.

- **Trust Indicators**
  Social proof elements are surfaced inline: a customer count milestone ("10,000+ Memories Saved"), a 5-star testimonial with attribution and volume detail (340 photos scanned), and mission-aligned statements.

---

## User Flows

### 1. Discovery and Orientation
1. User lands on the page and sees the hero section with headline, sub-headline, and two primary calls to action: **Start Scanning** and **See How It Works**.
2. The trust bar immediately below the hero reinforces credibility with three key statistics.
3. User may scroll to read the Mission section, which explains the emotional problem and the service's guarantees.

### 2. Learning How the Service Works
1. User clicks **See How It Works** in the hero (or the matching nav link) and is taken to the "How It Works" section.
2. Three sequential step cards — Ship Your Photos → We Scan & Enhance → Get Your Memories — describe the end-to-end process.
3. User continues scrolling to the "What We Digitize" section for media-type detail, or returns via the nav.

### 3. Exploring Media Types
1. User navigates to the **What We Scan** section via the nav link or by scrolling.
2. Four cards (Photos, Slides, Negatives, Film & Video) present media-specific descriptions and specification badges (DPI, supported formats, output type).
3. User gains enough information to assess whether their media is supported.

### 4. Reviewing What's Included
1. User scrolls to the **What's Included / Pricing** section (or uses nav anchor `#pricing`).
2. A nine-item grid lists every included feature with title and short description — no upsell items are present.
3. A **See Full Pricing** button prompts the user to take the next step toward pricing detail.

### 5. Evaluating Scan Quality
1. User navigates to the **Quality** section via nav or scroll.
2. A before/after panel presents a visual comparison of a scan pre- and post-enhancement.
3. Specification pills (600 DPI, Color Corrected, Dust Removed) are displayed beneath the comparison.
4. A four-step numbered list details the quality pipeline: High-Resolution Scan → Color Calibration → AI Enhancement → Quality Review.

### 6. Conversion
1. User encounters social proof via the testimonial card (5-star rating, quote, attribution, and volume stat).
2. The final CTA section presents a prominent **Start Your Order** button.
3. A secondary text link offers a path to the FAQ for users who are not yet ready to convert.
4. The nav CTA (**Get Started**) is available at all times as the page is sticky-scrolled.

### 7. Navigation and Exit Paths
1. The sticky navigation bar allows the user to jump to any major section at any point.
2. The footer repeats all major section links plus a Privacy Policy link.

---

## States and Variants

### Button States
- **Default:** Blush-colored (primary) and powder-blue (secondary) pill-shaped buttons at rest.
- **Hover:** Buttons lift via a upward translation, shadow intensifies, and background color darkens slightly. Applies to all CTA buttons and nav CTA.

### Card Hover States
- Step cards (How It Works), digitize cards (What We Digitize), and included-item tiles each have a distinct hover state: upward translation and increased shadow depth.

### Before/After Panel
- Rendered as a static two-panel split (Before / After) with a white divider and badge labels on each panel. No interactive slider is visible; this is a static visual comparison.

### Photo Frames (Hero)
- Four stacked, rotated photo frames are displayed in the hero. On hover, an individual frame scales up and its rotation resets to 0°.
- Frames render placeholder gradient backgrounds if the referenced image files are unavailable.

### Trust Bar — Responsive
- On mobile widths, trust stats stack vertically and separator dots are hidden.

### Navigation — Responsive
- On mobile widths, the nav link list is hidden; only the logo and the **Get Started** CTA button remain visible.

### Grids — Responsive
- Three-column and two-column grids (steps, digitize cards, included items) collapse to single-column layouts on smaller viewports.

### Section Labels / Overlines
- Multiple visual variants of the section label pill appear: blush-tinted (default), powder-blue-tinted, cream-on-dark, and navy-tinted. Each maps to the background color of its parent section.

### Empty / Loading / Error States
- No empty, loading, or error states are defined in the mockup. The page is a static marketing landing page with no dynamic data-fetching UI depicted.

---

## Acceptance Criteria

### Feature: Navigation
- The user can click any nav link (How It Works, What We Scan, Quality, Pricing, FAQ) and be scrolled to the corresponding section.
- The navigation bar remains visible at the top of the viewport as the user scrolls down the page.
- The **Get Started** nav button is visible and clickable at all times during scroll.
- On viewports narrower than 768px, nav links are hidden; only the logo and **Get Started** CTA are shown.

### Feature: Hero Section
- The system displays an overline label, a headline, a sub-headline description, and two CTA buttons.
- The **Start Scanning** button links to the order initiation flow.
- The **See How It Works** button scrolls the user to the How It Works section.
- Four decorative photo frames are displayed beneath the buttons with distinct rotations.
- Each photo frame applies a zero-rotation scale-up on hover.

### Feature: Trust Bar
- The system displays three trust statistics in a horizontal row on desktop.
- On mobile, statistics stack vertically and separator dots are not shown.

### Feature: How It Works
- The system displays exactly three step cards in sequence: Ship Your Photos, We Scan & Enhance, Get Your Memories.
- Each card contains a representative emoji, a title, and a description.
- Cards render in a single column on mobile.

### Feature: What We Digitize
- The system displays four media-type cards: Photos, Slides, Negatives, Film & Video.
- Each card contains an emoji, title, subtitle, description, and a set of specification badges.
- Photo cards show 600 DPI as the scan resolution; Slides and Negatives show 4,000 DPI; Film & Video shows HD Transfer with MP4 output.
- Supported formats are listed within each card description.

### Feature: What's Included
- The system displays nine distinct included features in a grid with no upsell or optional-add-on items.
- A **See Full Pricing** button is present and actionable.
- All nine features are labeled and described without reference to additional cost.

### Feature: Scan Quality Section
- The system displays a before/after split panel with clearly labeled "Before" and "After" states and a visible divider.
- Specification pills (600 DPI, Color Corrected, Dust Removed) appear beneath the comparison panel.
- Four numbered quality pipeline steps are displayed in order to the right of the comparison panel.

### Feature: Testimonial
- The system displays a 5-star rating, a customer quote, the customer's name, and a detail line showing tenure and volume (340 photos scanned).

### Feature: Final CTA
- The system displays a **Start Your Order** primary button.
- A secondary text link to the FAQ section is present beneath the primary button.

### Feature: Footer
- The footer displays the product logo, links to all major sections, a Privacy Policy link, and a copyright notice.
- All footer links navigate to their respective sections or pages.

### Feature: Originals Return
- Messaging on the page states that all original physical items are returned to the customer, insured and tracked.
- This claim appears in the hero sub-headline, the trust bar, and the mission section body copy.

### Feature: Secure Delivery
- The system communicates that digital files are delivered via a private, secure download link.
- This claim appears in the included features grid under "Secure Delivery."