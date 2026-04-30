import { NextResponse } from "next/server";
import { createCheckoutUrl, PLANS, type PlanKey } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId, email, name } = body as {
      plan: PlanKey;
      userId: string;
      email: string;
      name?: string;
    };

    if (!plan || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const variant = PLANS[plan];
    if (!variant) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutUrl = await createCheckoutUrl({
      variantId: variant.variantId,
      userId,
      email,
      name,
      redirectUrl: `${appUrl}/dashboard?subscribed=1`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/*import { NextResponse } from "next/server";
import { createCheckoutUrl, PLANS, type PlanKey } from "@/lib/lemonsqueezy";
import { createServerClientInstance } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClientInstance();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, name } = await req.json();

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const variant = PLANS[plan as PlanKey];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutUrl = await createCheckoutUrl({
      variantId: variant.variantId,
      userId: user.id,
      email: user.email!,
      name,
      redirectUrl: `${appUrl}/dashboard?subscribed=1`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
*/
