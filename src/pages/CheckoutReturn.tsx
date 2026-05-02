import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/site/AuthProvider";
import { getStripeEnvironment } from "@/lib/stripe";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!user || !sessionId) return;
    let attempts = 0;
    const env = getStripeEnvironment();
    const tick = async () => {
      attempts++;
      const [{ data: sub }, { data: tpls }] = await Promise.all([
        supabase.from("subscriptions").select("status").eq("user_id", user.id).eq("environment", env).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("template_purchases").select("id").eq("user_id", user.id).eq("environment", env).limit(1),
      ]);
      const ok = (sub && ["active","trialing","past_due"].includes((sub as any).status)) || (tpls && tpls.length > 0);
      if (ok) { setConfirmed(true); return; }
      if (attempts < 15) setTimeout(tick, 1500);
    };
    tick();
  }, [user, sessionId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="container flex flex-col items-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-serif text-4xl md:text-5xl">Thank you</h1>
        <p className="mt-3 max-w-md text-dim">
          {!sessionId
            ? "No session information found."
            : confirmed
              ? "Your account has been updated. Enjoy."
              : (<span className="inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Confirming your purchase…</span>)}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold">
            <Link to="/dashboard">Go to my CVs</Link>
          </Button>
          <Button asChild variant="goldOutline">
            <Link to="/builder">Start a new CV</Link>
          </Button>
        </div>
        {sessionId && (
          <p className="mt-8 text-[10px] uppercase tracking-widest text-dim">
            Ref · {sessionId.slice(0, 24)}…
          </p>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default CheckoutReturn;