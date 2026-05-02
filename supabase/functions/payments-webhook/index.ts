import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supabase;
}

async function syncProfilePlan(userId: string, priceId: string, status: string, periodEnd: number | null) {
  const isPro =
    (priceId === "pro_monthly" || priceId === "pro_yearly") &&
    (status === "active" || status === "trialing" || status === "past_due" ||
      (status === "canceled" && periodEnd && periodEnd * 1000 > Date.now()));
  await getSupabase()
    .from("profiles")
    .update({ plan: isPro ? "pro" : "free", updated_at: new Date().toISOString() })
    .eq("id", userId);
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  await syncProfilePlan(userId, priceId, subscription.status, periodEnd ?? null);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    await getSupabase().from("profiles").update({ plan: "free", updated_at: new Date().toISOString() }).eq("id", userId);
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.mode !== "payment") return; // subscriptions handled by subscription.* events
  const userId = session.metadata?.userId;
  if (!userId) {
    console.warn("checkout.session.completed without userId metadata");
    return;
  }

  // Re-fetch session expanded with line items + product metadata
  const stripe = createStripeClient(env);
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product"],
  });
  const items = (full as any).line_items?.data ?? [];

  for (const li of items) {
    const price = li.price;
    const product = price?.product;
    const priceLookup =
      price?.metadata?.lovable_external_id ||
      product?.metadata?.lovable_external_id ||
      price?.id;
    const qty = li.quantity || 1;

    if (priceLookup === "ai_credits_pack" || priceLookup === "ai_credits_pack_one_time") {
      const granted = 50 * qty;
      const { data: prof } = await getSupabase()
        .from("profiles").select("credits").eq("id", userId).maybeSingle();
      const current = (prof as { credits?: number } | null)?.credits ?? 0;
      await getSupabase()
        .from("profiles")
        .update({ credits: current + granted, updated_at: new Date().toISOString() })
        .eq("id", userId);
      console.log("Granted", granted, "credits to", userId);
    } else if (priceLookup === "premium_template" || priceLookup === "premium_template_one_time") {
      const templateId = session.metadata?.templateId || "any";
      await getSupabase().from("template_purchases").upsert(
        {
          user_id: userId,
          template_id: templateId,
          stripe_session_id: session.id,
          environment: env,
        },
        { onConflict: "stripe_session_id" }
      );
      console.log("Template", templateId, "unlocked for", userId);
    } else {
      console.log("Unknown one-time price:", priceLookup);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  await getSupabase()
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env) as any;

  // Idempotency: skip if already processed
  if (event.id) {
    const { error: insErr } = await getSupabase()
      .from("purchase_events")
      .insert({ stripe_event_id: event.id, event_type: event.type, environment: env });
    if (insErr) {
      // unique violation — already processed
      console.log("Event already processed:", event.id);
      return;
    }
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook missing/invalid env query parameter:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
