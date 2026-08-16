# Tokophi Engineering & UI/UX Perfection Specification

> **Historical/superseded record — 2026-08-16.** This aspirational specification is superseded as an owner. Use `PRD.md`, `UI-UX-DESIGN-SYSTEM.md`, relevant feature specifications, and `TASKS.md`.

**Target:** DotAds Engine v2 + Tokophi Direct-Response Commerce Architecture  
**Goal:** Deliver a world-class, high-converting, resilient, accessible, and sub-second direct-response ecommerce experience for high-volume Indonesian ad traffic.

---

## 1. Direct-Response Storefront & Funnel UX (Tokophi Baseline)

### 1.1 Zero Cumulative Layout Shift (CLS < 0.02)
- Storefront CSS MUST include a `:not(:defined)` placeholder for `<dotads-form>` with fixed `min-height: 520px` and skeleton animation.
- Image containers MUST have explicit `aspect-ratio` and width/height attributes to prevent layout jumps during image loading.

### 1.2 Mobile-First High-Converting Sticky Bar
- Render a fixed bottom bar on mobile screens (`< md`):
  - Displays product price, discount badge (e.g. `Hemat 45%`), and a prominent **"Pesan Sekarang (COD)"** button.
  - Smooth scroll anchor directly to the `<dotads-form>` instance.
  - Hides automatically when the form itself enters viewport (using `IntersectionObserver`).

### 1.3 High-Trust Merchandising Seals & Guarantee Badges
- Direct-response trust elements:
  - Vector SVG badges for: **"100% Original"**, **"Garansi Uang Kembali 30 Hari"**, **"Bisa Bayar di Tempat (COD)"**, **"Pengiriman Kilat 24-48 Jam"**.
  - Live stock urgency indicator: `Stok Tinggal 7 Pcs Lagi!` with animated pulse effect.
  - Recent purchase social proof toast notification (toggleable).

---

## 2. Form Engine Presets Specification (`FULL`, `HYBRID`, `MIDDLE`, `MINI`)

### 2.1 Preserved Component State across Renders
- `<dotads-form>` Web Component MUST encapsulate state in a private object (`#state = { step, values, errors, loading }`).
- Component re-renders MUST NOT wipe form input values.
- Step transitions in `HYBRID` mode MUST validate `step 1` fields via `reportValidity()` before advancing, and focus the first element of `step 2`.

### 2.2 Server-Authoritative Price & Rate Calculation
- Form requests submit ONLY: `{ tenantId, formPreset, variantId, quantity, subdistrictId, courierCode, paymentMethod, turnstileToken, attribution, idempotencyKey }`.
- Server re-calculates `subtotalMinor`, `shippingCostMinor`, `discountMinor`, and `totalMinor` using canonical database catalog rates and live shipping quotes.

### 2.3 QRIS / VA Payment Presentation Surface
- On prepaid order creation (`QRIS`, `VA_BCA`, `VA_MANDIRI`), render an interactive **Payment Pending Modal / Surface**:
  - Displays exact payable total, transaction expiry timer, QR image / VA string with one-tap copy button.
  - Polls `/api/v1/public/orders/:id/payment-status` every 3 seconds.
  - Automatically transitions to "Payment Confirmed!" with confetti and fires server-authoritative Purchase signal.

---

## 3. Signal Engine & Multi-Platform Outbox Standard

### 3.1 100% Client & Server Deduplication
- Server generates a single deterministic event ID per conversion step: `evt_lead_${orderId}` and `evt_purchase_${orderId}`.
- Both Browser Pixel (`fbq`, `gtag`, `ttq`) and Server Outbox use the **identical event ID**.

### 3.2 Server-Authoritative Conversion Timing
- **Lead / Form Submitted**: Triggered at order creation.
- **Purchase (Prepaid)**: Enqueued ONLY when payment status becomes `PAID` / `SUCCESS` via gateway webhook.
- **Purchase (COD)**: Enqueued ONLY when courier confirms delivery or order moves to `CONFIRMED` per merchant preference.

### 3.3 Google Consent Mode v2 & Multi-Platform Wire Payloads
- Client sets default consent (`ad_storage: 'granted'`, `ad_user_data: 'granted'`, `ad_personalization: 'granted'`).
- Outbox worker constructs platform-specific wire payloads:
  - **Meta CAPI**: Graph API v19.0 `/events` with SHA-256 hashed `em`, `ph`, `fn`, raw `fbp`, `fbc`, `client_ip_address`, `client_user_agent`.
  - **Google Ads**: Offline Conversion Upload API with `gclid`, `gbraid`, `wbraid`, `conversion_date_time`, `conversion_value`, Enhanced Conversions user identifiers.
  - **TikTok Ads**: Events API v2 with `event`, `event_id`, `timestamp`, `context.user` (`phone_number`, `email`, `ttclid`, `user_agent`, `ip`), `properties`.

---

## 4. Administrative UX & Operations Engine

### 4.1 Real API-Driven Admin Dashboard
- Replace all mock data (`SAMPLE_ORDERS`, local `useState`) in `apps/admin` with real REST API integration using React Query / SWR / standard fetch hooks.
- Mobile-responsive data tables: render standard data table on desktop, automatically transform into responsive card list on mobile.

### 4.2 Order Operations & Logistics Manifest Engine
- Actionable order operations:
  - **Status Transitions**: `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`.
  - **Bulk Dispatch**: Single-click bulk pickup request to Mengantar API.
  - **Thermal Shipping Label PDF**: Generate 100x150mm courier shipping label with barcode and waybill.

---

## 5. Security & Isolation Invariants

1. **Zero Header Override for Tenant ID**: Tenant context strictly resolved from authenticated session or validated custom domain host.
2. **Default-Deny RBAC Middleware**: Every `/admin` route requires explicit permission assertion.
3. **Mandatory HMAC Webhook Verification**: AutoLaris & Mengantar webhooks fail fast with HTTP 401 if HMAC signature header is missing or invalid.
4. **Encrypted Provider Credentials**: AES-256-GCM envelope encryption for all third-party secrets stored in database.
