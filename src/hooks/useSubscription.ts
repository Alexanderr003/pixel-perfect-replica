import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/site/AuthProvider";
import { getStripeEnvironment } from "@/lib/stripe";

type SubRow = {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export function useSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!user) {
      setSub(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("status, price_id, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub((data as SubRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refetch();
    if (!user) return;
    const channel = supabase
      .channel(`subs:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const now = Date.now();
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const isActive =
    !!sub &&
    (((sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") &&
      (periodEnd === null || periodEnd > now)) ||
      (sub.status === "canceled" && periodEnd !== null && periodEnd > now));
  const PRO_IDS = new Set(["pro_monthly", "pro_yearly", "elite_monthly", "elite_yearly"]);
  const ELITE_IDS = new Set(["elite_monthly", "elite_yearly"]);
  const isPro = isActive && !!sub?.price_id && PRO_IDS.has(sub.price_id);
  const isElite = isActive && !!sub?.price_id && ELITE_IDS.has(sub.price_id);

  return { sub, isActive, isPro, isElite, loading, refetch };
}