import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/site/AuthProvider";
import { CvPreview, type CvPreviewData } from "@/components/cv/CvPreview";
import { toast } from "sonner";
import { Download, FileText, Loader2, Plus, Trash2, Sparkles, CreditCard, ExternalLink } from "lucide-react";
import { downloadCvPdf } from "@/lib/pdf";
import { useState as useStateAlias } from "react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/payments/UpgradeDialog";
import { getStripeEnvironment } from "@/lib/stripe";

type CvRow = {
  id: string;
  title: string;
  template_id: string;
  data: CvPreviewData;
  is_published: boolean;
  updated_at: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CvRow[] | null>(null);
  const { isPro, canCreateNewCv, credits, ownedTemplates } = useEntitlements();
  const { sub } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("cvs")
      .select("id, title, template_id, data, is_published, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Could not load your CVs");
      setCvs([]);
      return;
    }
    setCvs((data ?? []) as unknown as CvRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this CV? This cannot be undone.")) return;
    const { error } = await supabase.from("cvs").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    toast.success("CV deleted");
    setCvs((c) => c?.filter((x) => x.id !== id) ?? null);
  };

  const handleNewCv = (e: React.MouseEvent) => {
    if (!canCreateNewCv) {
      e.preventDefault();
      setUpgradeOpen(true);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.origin + "/dashboard",
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Could not open portal");
      window.open(data.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="container py-12 md:py-16">
        {/* Account / Billing */}
        <div className="mb-10 rounded-lg border border-subtle bg-surface p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">Account</p>
              <h2 className="mt-2 font-serif text-2xl">{user?.email}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
                <span className={`rounded-sm border px-3 py-1 ${isPro ? "border-gold bg-gold/10 text-gold" : "border-subtle text-dim"}`}>
                  {isPro ? "Pro" : "Free"}
                </span>
                <span className="text-dim">{credits} AI credits</span>
                <span className="text-dim">{ownedTemplates.size} owned templates</span>
                {sub?.current_period_end && isPro && (
                  <span className="text-dim">
                    {sub.cancel_at_period_end ? "Ends" : "Renews"} {new Date(sub.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isPro ? (
                <Button variant="goldOutline" size="sm" onClick={openPortal} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Manage subscription <ExternalLink className="ml-1.5 h-3 w-3" />
                </Button>
              ) : (
                <Button variant="gold" size="sm" onClick={() => setUpgradeOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Your studio</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">My CVs</h1>
            <p className="mt-2 text-sm text-dim">
              {cvs?.length ?? 0} {cvs?.length === 1 ? "document" : "documents"}{!isPro && " · Free plan: 1 CV"}
            </p>
          </div>
          <Button variant="gold" asChild={canCreateNewCv} onClick={canCreateNewCv ? undefined : handleNewCv}>
            {canCreateNewCv ? (
              <Link to="/builder">
                <Plus className="mr-2 h-4 w-4" /> New CV
              </Link>
            ) : (
              <span className="inline-flex items-center"><Plus className="mr-2 h-4 w-4" /> New CV</span>
            )}
          </Button>
        </div>

        <div className="mt-10">
          {cvs === null ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : cvs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cvs.map((cv) => (
                <CvCard key={cv.id} cv={cv} onDelete={() => remove(cv.id)} isPro={isPro} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} reason={canCreateNewCv ? "watermark" : "cv_limit"} />
    </div>
  );
};

const CvCard = ({ cv, onDelete, isPro }: { cv: CvRow; onDelete: () => void; isPro: boolean }) => {
  // Provide safe defaults for older CVs that may miss fields
  const data: CvPreviewData = {
    basics: { fullName: "", headline: "", email: "", phone: "", location: "", website: "", ...(cv.data?.basics ?? {}) },
    summary: cv.data?.summary ?? "",
    experience: cv.data?.experience ?? [],
    education: cv.data?.education ?? [],
    skills: cv.data?.skills ?? [],
    templateId: cv.data?.templateId ?? cv.template_id ?? "ivory",
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-subtle bg-surface transition-all hover:border-gold/50">
      {/* Thumbnail */}
      <div
        className="relative w-full overflow-hidden bg-background/40"
        style={{ aspectRatio: "210 / 297" }}
      >
        <ThumbPreview data={data} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      {/* Meta */}
      <div className="border-t border-subtle p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-lg text-foreground">{cv.title}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-dim">
              {cv.template_id} · {new Date(cv.updated_at).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-dim opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            aria-label="Delete CV"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="goldOutline" size="sm" className="flex-1" asChild>
            <Link to={`/builder?id=${cv.id}`}>Open</Link>
          </Button>
          <DownloadButton data={data} title={cv.title} isPro={isPro} />
        </div>
      </div>
    </div>
  );
};

const DownloadButton = ({ data, title, isPro }: { data: CvPreviewData; title: string; isPro: boolean }) => {
  const [busy, setBusy] = useStateAlias(false);
  const handle = async () => {
    setBusy(true);
    try {
      const safe = (title || "cv").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await downloadCvPdf(data, `${safe || "cv"}.pdf`, { watermark: !isPro });
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" onClick={handle} disabled={busy} className="text-dim hover:text-foreground">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </Button>
  );
};

const ThumbPreview = ({ data }: { data: CvPreviewData }) => {
  const A4_WIDTH = 794;
  const [scale, setScale] = useState(0.3);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const update = () => setScale(ref.clientWidth / A4_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref);
    return () => ro.disconnect();
  }, [ref]);

  return (
    <div ref={setRef} className="absolute inset-0 overflow-hidden">
      <div className="absolute left-0 top-0">
        <CvPreview data={data} scale={scale} />
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="rounded-lg border border-dashed border-subtle bg-surface/50 px-8 py-20 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
      <FileText className="h-6 w-6 text-gold" />
    </div>
    <h3 className="mt-6 font-serif text-2xl text-foreground">Start your first CV</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm text-dim">
      Build a polished, ATS-ready CV in 4 quick steps.
    </p>
    <Button variant="gold" className="mt-6" asChild>
      <Link to="/builder">
        <Plus className="mr-2 h-4 w-4" /> Create CV
      </Link>
    </Button>
  </div>
);

export default Dashboard;