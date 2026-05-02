import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

interface Body {
  environment: StripeEnv;
  returnUrl?: string;
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
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");

    const { data: userRes, error: authErr } = await getSupabase().auth.getUser(token);
    if (authErr || !userRes.user) throw new Error("Unauthorized");
    const userId = userRes.user.id;

    const body = (await req.json()) as Body;
    if (body.environment !== "sandbox" && body.environment !== "live") {
      throw new Error("Invalid environment");
    }

    const { data: sub } = await getSupabase()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", body.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const customerId = (sub as { stripe_customer_id?: string } | null)?.stripe_customer_id;
    if (!customerId) throw new Error("No subscription found");

    const stripe = createStripeClient(body.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      ...(body.returnUrl && { return_url: body.returnUrl }),
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("create-portal-session error:", message);
    const status = message === "Unauthorized" ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
