/**
 * LemonSqueezy Payment Integration
 *
 * WHY: LemonSqueezy is a Merchant of Record — it handles VAT/tax globally
 * and works in countries where Stripe has restrictions. No Stripe account needed.
 * HOW: We hit their REST API to create checkout sessions and verify webhooks.
 *
 * Docs: https://docs.lemonsqueezy.com/api
 */

export const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

// These come from your LemonSqueezy dashboard → Products → Variants
export const PLANS = {
  monthly: {
    name: "Monthly",
    variantId: process.env.LS_MONTHLY_VARIANT_ID!, // e.g. "123456"
    amount: 999, // £9.99 in pence (for display only — LS holds real price)
    label: "£9.99/mo",
  },
  yearly: {
    name: "Yearly",
    variantId: process.env.LS_YEARLY_VARIANT_ID!, // e.g. "123457"
    amount: 8999, // £89.99 in pence
    label: "£89.99/yr",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Create a LemonSqueezy checkout URL for a given variant/plan.
 * Redirects user to hosted LS checkout page (no card details on our server).
 *
 * WHY: LS checkout handles PCI compliance, tax, and currency — we just redirect.
 */
export async function createCheckoutUrl({
  variantId,
  userId,
  email,
  name,
  redirectUrl,
}: {
  variantId: string;
  userId: string;
  email: string;
  name?: string;
  redirectUrl: string;
}): Promise<string> {
  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LS_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            embed: false,
          },
          checkout_data: {
            email,
            name: name || "",
            custom: {
              user_id: userId,
            },
          },
          product_options: {
            redirect_url: redirectUrl,
            receipt_thank_you_note:
              "Welcome to GolfDraw! You're now part of the draw.",
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LS_STORE_ID },
          },
          variant: {
            data: { type: "variants", id: variantId },
          },
        },
      },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.detail || "Failed to create checkout");
  }

  return json.data.attributes.url as string;
}

/**
 * Verify LemonSqueezy webhook signature using the signing secret.
 * WHY: Prevents fake webhook calls from modifying subscription state.
 * The signature is HMAC-SHA256 of the raw body using the webhook secret.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

/**
 * Calculate charity contribution amount (in pence)
 * WHY: Every subscription must route minimum 10% to the user's chosen charity.
 */
export function calcCharityAmount(amountPence: number, pct: number): number {
  return Math.floor(amountPence * (pct / 100));
}

/**
 * Calculate prize pool contribution (30% of each subscription)
 * WHY: Funds the monthly jackpot, 4-match, and 3-match prize tiers.
 */
export function calcPrizePoolAmount(amountPence: number): number {
  return Math.floor(amountPence * 0.3);
}
