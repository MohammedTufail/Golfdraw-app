/**
 * POST /api/webhooks/lemonsqueezy
 *
 * WHY: LemonSqueezy sends real-time events (subscription_created,
 * subscription_updated, subscription_cancelled, order_created etc.)
 * to this endpoint whenever payment state changes.
 *
 * We MUST verify the signature first — any unsigned request is rejected.
 * Then we update the subscriptions table in Supabase accordingly.
 *
 * HOW: In LS dashboard → Webhooks → Add Endpoint → paste your production URL
 * e.g. https://your-app.vercel.app/api/webhooks/lemonsqueezy
 * Select events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
 */


import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const secret = process.env.LS_WEBHOOK_SECRET!;

  const valid = await verifyWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName =
    event.meta && typeof event.meta === "object"
      ? ((event.meta as Record<string, unknown>).event_name as string)
      : "";
  const attrs =
    event.data && typeof event.data === "object"
      ? ((event.data as Record<string, unknown>).attributes as Record<
          string,
          unknown
        >)
      : {};
  const custom =
    event.meta && typeof event.meta === "object"
      ? ((event.meta as Record<string, unknown>).custom_data as Record<
          string,
          unknown
        >) || {}
      : {};

  try {
    if (eventName === "order_created") {
      const userId = custom.user_id as string;
      if (!userId) return NextResponse.json({ received: true });

      const variantId = String(
        (attrs.first_subscription_item as Record<string, unknown> | undefined)
          ?.variant_id || "",
      );
      const plan: "monthly" | "yearly" =
        variantId === process.env.LS_YEARLY_VARIANT_ID ? "yearly" : "monthly";
      const amountPence = typeof attrs.total === "number" ? attrs.total : 999;
      const renewalDate = new Date();
      renewalDate.setMonth(
        renewalDate.getMonth() + (plan === "yearly" ? 12 : 1),
      );

      await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        plan,
        status: "active",
        lemonsqueezy_customer_id: String(attrs.customer_id || ""),
        lemonsqueezy_subscription_id: String(
          (event.data as Record<string, unknown>).id || "",
        ),
        amount_pence: amountPence,
        renewal_date: renewalDate.toISOString(),
      });
    } else if (
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      const lsId = String((event.data as Record<string, unknown>).id || "");
      const status =
        attrs.status === "active"
          ? "active"
          : attrs.status === "cancelled"
            ? "cancelled"
            : "lapsed";
      const updateData: Partial<
        Database["public"]["Tables"]["subscriptions"]["Update"]
      > = {
        status,
        updated_at: new Date().toISOString(),
      };

      await supabaseAdmin
        .from("subscriptions")
        .update(updateData)
        .eq("lemonsqueezy_subscription_id", lsId);
    }
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/*import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { createClient } from "@supabase/supabase-js";

// Use service role client — webhooks run server-side, bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const secret = process.env.LS_WEBHOOK_SECRET!;

  // Step 1: Verify webhook signature — reject fakes
  const valid = await verifyWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    console.warn("Invalid LS webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName: string = event.meta?.event_name;
  const attrs = event.data?.attributes;
  const custom = event.meta?.custom_data || {};

  console.log(`LS Webhook: ${eventName}`, { userId: custom.user_id });

  // Step 2: Handle relevant events
  try {
    switch (eventName) {
      case "subscription_created": {
        // First payment — create subscription record
        const userId = custom.user_id;
        if (!userId) break;

        // Determine plan from variant ID
        const variantId = String(
          attrs.first_subscription_item?.variant_id || "",
        );
        const plan =
          variantId === process.env.LS_YEARLY_VARIANT_ID ? "yearly" : "monthly";
        const amountPence = attrs.total || 0; // LS returns in cents/pence

        // Calculate renewal date
        const renewalDate = new Date();
        renewalDate.setMonth(
          renewalDate.getMonth() + (plan === "yearly" ? 12 : 1),
        );

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            lemonsqueezy_customer_id: String(attrs.customer_id || ""), // repurposed field for LS customer
            lemonsqueezy_subscription_id: String(event.data?.id || ""), // repurposed for LS subscription ID
            amount_pence: amountPence,
            renewal_date: renewalDate.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        // Also log charity contribution if user has charity selected
        await handleCharityContribution(
          userId,
          amountPence,
          String(event.data?.id || ""),
        );
        break;
      }

      case "subscription_updated": {
        const lsSubscriptionId = String(event.data?.id || "");
        const status =
          attrs.status === "active"
            ? "active"
            : attrs.status === "cancelled"
              ? "cancelled"
              : attrs.status === "expired"
                ? "lapsed"
                : "inactive";

        const renewsAt = attrs.renews_at
          ? new Date(attrs.renews_at).toISOString()
          : null;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            renewal_date: renewsAt,
            updated_at: new Date().toISOString(),
          })
          .eq("lemonsqueezy_subscription_id", lsSubscriptionId);
        break;
      }

      case "subscription_cancelled": {
        const lsSubscriptionId = String(event.data?.id || "");
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("lemonsqueezy_subscription_id", lsSubscriptionId);
        break;
      }

      case "subscription_expired": {
        const lsSubscriptionId = String(event.data?.id || "");
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "lapsed", updated_at: new Date().toISOString() })
          .eq("lemonsqueezy_subscription_id", lsSubscriptionId);
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


 
async function handleCharityContribution(
  userId: string,
  amountPence: number,
  subscriptionLsId: string,
) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("charity_id, charity_contribution_pct")
    .eq("id", userId)
    .single();

  if (!profile?.charity_id) return;

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!sub) return;

  const contributionAmount =
    Math.floor(amountPence * (profile.charity_contribution_pct / 100)) / 100;

  await supabaseAdmin.from("charity_contributions").insert({
    user_id: userId,
    charity_id: profile.charity_id,
    subscription_id: sub.id,
    amount: contributionAmount,
    contribution_date: new Date().toISOString().split("T")[0],
  });

  // Update charity total
  await supabaseAdmin.rpc("increment_charity_total", {
    charity_uuid: profile.charity_id,
    amount_to_add: contributionAmount,
  });
}
*/