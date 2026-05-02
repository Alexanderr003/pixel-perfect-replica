import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
  metadata?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body?.priceId || !/^[a-zA-Z0-9_-]+$/.test(body.priceId)) throw new Error("Invalid priceId");
    if (!body.returnUrl) throw new Error("Missing returnUrl");
    if (body.environment !== "sandbox" && body.environment !== "live") throw new Error("Invalid environment");

    const stripe = createStripeClient(body.environment);
    const prices = await stripe.prices.list({ lookup_keys: [body.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: body.quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: body.returnUrl,
      ...(body.customerEmail && { customer_email: body.customerEmail }),
      ...(body.userId && {
        metadata: { userId: body.userId, ...(body.metadata ?? {}) },
        ...(isRecurring && { subscription_data: { metadata: { userId: body.userId } } }),
      }),
      ...(!body.userId && body.metadata && { metadata: body.metadata }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("create-checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});