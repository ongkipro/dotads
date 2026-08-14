# DotAds Engine v2 — Headless Storefront & SDK Integration Guide

This specification provides the turnkey API contract, draft-lead protocol, and ad-attribution rules for developers building **Custom Headless Frontends** (Next.js, Remix, SvelteKit, Astro, Nuxt, Mobile Apps, or Custom Web) connected to DotAds Engine v2.

---

## 1. Headless REST API Architecture

Custom storefronts interact with the **Hono Headless API** (`https://api.namadomain.com/api/v1/public/*`):

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/public/products` | `GET` | Fetch active catalog products, variants, media, & auto Google Categories |
| `/api/v1/public/products/:slug` | `GET` | Fetch single product details with GTIN, stock, & variant matrix |
| `/api/v1/public/regions/search` | `GET` | Fast Kecamatan autocomplete (<15ms) via pre-seeded GIN Trigram DB |
| `/api/v1/public/shipping/rates` | `POST` | Calculate live Mengantar 3PL rates + fallback zone fee adjustments |
| `/api/v1/public/orders/draft-lead` | `POST` | **Abandoned Order Safety Net:** Capture draft lead (Name + Phone) instantly |
| `/api/v1/public/orders` | `POST` | Create full order $ightarrow$ Auto-push to Mengantar 3PL $ightarrow$ Fire Meta/Google/TikTok CAPI |

---

## 2. Abandoned Order & Draft Lead Protocol

To prevent lost revenue from abandoned checkouts on custom frontends:

```typescript
// 1. Fire on Phone Input Change (Debounced 500ms)
async function sendDraftLead(payload: {
  tenantId: string;
  formId: string;
  customerName: string;
  customerPhone: string;
  variantId?: string;
  attribution: Record<string, string>;
}) {
  await fetch('https://api.namadomain.com/api/v1/public/orders/draft-lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': payload.tenantId,
    },
    body: JSON.stringify({
      form_id: payload.formId,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      variant_id: payload.variantId,
      attribution_json: payload.attribution,
    }),
  });
}
```

---

## 3. Multi-Ad Platform Attribution Payload Schema

Every order request submitted from a custom frontend MUST pass the captured query parameters and cookies to ensure **100% precision in Meta Ads, Google Ads, and TikTok Ads CAPI**:

```typescript
export interface MultiAdAttributionPayload {
  // Meta Ads Cookies & Parameters
  fbp?: string;          // Cookie _fbp
  fbc?: string;          // Cookie _fbc
  fbclid?: string;       // URL param fbclid
  
  // Google Ads Click IDs & Tags
  gclid?: string;        // URL param gclid
  gbraid?: string;       // URL param gbraid (iOS app/web)
  wbraid?: string;       // URL param wbraid (iOS web)
  
  // TikTok Ads Click IDs
  ttclid?: string;       // Cookie / URL param ttclid
  
  // Standard UTM Tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

// Client Helper Function to Extract Attribution
export function extractAttribution(): MultiAdAttributionPayload {
  const params = new URLSearchParams(window.location.search);
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc') || params.get('fbclid') ? `fb.1.${Date.now()}.${params.get('fbclid')}` : undefined,
    fbclid: params.get('fbclid') ?? undefined,
    gclid: params.get('gclid') ?? undefined,
    gbraid: params.get('gbraid') ?? undefined,
    wbraid: params.get('wbraid') ?? undefined,
    ttclid: getCookie('ttclid') || params.get('ttclid') ?? undefined,
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  };
}
```

---

## 4. End-to-End Headless Checkout Order Submission

```typescript
export async function submitHeadlessOrder(orderData: {
  tenantId: string;
  items: Array<{ variantId: string; quantity: number }>;
  customer: { name: string; phone: string; email?: string; address: string; subdistrictId: string };
  shipping: { courierCode: string; serviceCode: string; costIdr: number };
  paymentMethod: 'COD' | 'QRIS' | 'VA';
}) {
  const attribution = extractAttribution();

  const response = await fetch('https://api.namadomain.com/api/v1/public/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': orderData.tenantId,
    },
    body: JSON.stringify({
      items: orderData.items,
      customer_name: orderData.customer.name,
      customer_phone: orderData.customer.phone,
      customer_email: orderData.customer.email,
      shipping_address: orderData.customer.address,
      subdistrict_id: orderData.customer.subdistrictId,
      courier_code: orderData.shipping.courierCode,
      courier_service: orderData.shipping.serviceCode,
      shipping_cost_idr: orderData.shipping.costIdr,
      payment_method: orderData.paymentMethod,
      attribution_json: attribution,
    }),
  });

  return await response.json();
}
```
