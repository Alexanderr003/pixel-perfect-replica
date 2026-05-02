import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/site/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment } from "@/lib/stripe";

const PREMIUM_TEMPLATES = new Set([
  "obsidian", "noir", "oxford", "mercer", "sterling",
  "atelier", "rose", "aurum",
]);

export function isPremiumTemplate(id: string): boolean {
  return PREMIUM_TEMPLATES.has(id);
}

export function useEntitlements() {
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [ownedTemplates, setOwnedTemplates] = useState<Set<string>>(new Set());
  const [cvCount, setCvCount] = useState<number>(0);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setOwnedTemplates(new Set());
      setCvCount(0);
      setCredits(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const env = getStripeEnvironment();
    const [tpls, cvs, prof] = await Promise.all([
      supabase
        .from("template_purchases")
        .select("template_id")
        .eq("user_id", user.id)
        .eq("environment", env),
      supabase.from("cvs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("profiles").select("credits").eq("id", user.id).maybeSingle(),
    ]);
    setOwnedTemplates(new Set((tpls.data ?? []).map((t: { template_id: string }) => t.template_id)));
    setCvCount(cvs.count ?? 0);
    setCredits((prof.data as { credits?: number } | null)?.credits ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel(`ent:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "template_purchases", filter: `user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "cvs", filter: `user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const canUseTemplate = (templateId: string): boolean => {
    if (!isPremiumTemplate(templateId)) return true;
    if (isPro) return true;
    return ownedTemplates.has(templateId);
  };

  const canCreateNewCv = isPro || cvCount === 0;

  return {
    isPro,
    ownedTemplates,
    cvCount,
    credits,
    canUseTemplate,
    canCreateNewCv,
    loading: loading || subLoading,
    refresh,
  };
}
