import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, Download, Save, ArrowLeft, Plus, Trash2, Lock, Check } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/site/AuthProvider";
import { CvPreview, type CvPreviewData } from "@/components/cv/CvPreview";
import { downloadCvPdf } from "@/lib/pdf";
import { useEntitlements, isPremiumTemplate } from "@/hooks/useEntitlements";
import { UpgradeDialog } from "@/components/payments/UpgradeDialog";
import { toast } from "sonner";

import tplBlanc from "@/assets/template-blanc.jpg";
import tplObsidian from "@/assets/template-obsidian.jpg";
import tplNord from "@/assets/template-nord.jpg";
import tplIvory from "@/assets/template-ivory.jpg";
import tplNoir from "@/assets/template-noir.jpg";
import tplAtelier from "@/assets/template-atelier.jpg";
import tplOxford from "@/assets/template-oxford.jpg";
import tplMercer from "@/assets/template-mercer.jpg";
import tplLinea from "@/assets/template-linea.jpg";
import tplRose from "@/assets/template-rose.jpg";
import tplSterling from "@/assets/template-sterling.jpg";
import tplAurum from "@/assets/template-aurum.jpg";

type Line = "Core" | "Pro" | "Elite";
type Template = { id: string; name: string; line: Line; img: string };

const TEMPLATES: Template[] = [
  { id: "blanc", name: "Blanc", line: "Core", img: tplBlanc },
  { id: "ivory", name: "Ivory", line: "Core", img: tplIvory },
  { id: "nord", name: "Nord", line: "Core", img: tplNord },
  { id: "linea", name: "Linea", line: "Core", img: tplLinea },
  { id: "obsidian", name: "Obsidian", line: "Pro", img: tplObsidian },
  { id: "noir", name: "Noir", line: "Pro", img: tplNoir },
  { id: "oxford", name: "Oxford", line: "Pro", img: tplOxford },
  { id: "mercer", name: "Mercer", line: "Pro", img: tplMercer },
  { id: "sterling", name: "Sterling", line: "Pro", img: tplSterling },
  { id: "atelier", name: "Atelier", line: "Elite", img: tplAtelier },
  { id: "rose", name: "Rosé", line: "Elite", img: tplRose },
  { id: "aurum", name: "Aurum", line: "Elite", img: tplAurum },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyData: CvPreviewData = {
  basics: { fullName: "", headline: "", email: "", phone: "", location: "", website: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  templateId: "blanc",
};

const Editor = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cvId = params.get("id");
  const { user, loading: authLoading } = useAuth();
  const { canUseTemplate, isPro } = useEntitlements();

  const [data, setData] = useState<CvPreviewData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [downloading, setDownloading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTpl, setUpgradeTpl] = useState<string | undefined>();
  const [scale, setScale] = useState(0.6);

  const hydratedRef = useRef(false);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  // Auth + load
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!cvId) {
      navigate("/builder", { replace: true });
      return;
    }
    supabase
      .from("cvs")
      .select("data, template_id")
      .eq("id", cvId)
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (error || !row) {
          toast.error("Could not load this CV");
          navigate("/dashboard", { replace: true });
          return;
        }
        const d = (row.data ?? {}) as Partial<CvPreviewData>;
        setData({
          basics: { fullName: "", headline: "", email: "", phone: "", location: "", website: "", ...(d.basics ?? {}) },
          summary: d.summary ?? "",
          experience: d.experience ?? [],
          education: d.education ?? [],
          skills: d.skills ?? [],
          templateId: d.templateId ?? row.template_id ?? "blanc",
        });
        setLoading(false);
        setTimeout(() => { hydratedRef.current = true; }, 0);
      });
  }, [authLoading, user, cvId, navigate]);

  // Responsive scale to fit preview width
  useEffect(() => {
    const compute = () => {
      const w = previewWrapRef.current?.clientWidth ?? 800;
      // 210mm ≈ 793px
      const next = Math.min(1, Math.max(0.4, (w - 32) / 793));
      setScale(next);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [loading]);

  // Autosave
  useEffect(() => {
    if (!user || !cvId || !hydratedRef.current) return;
    const t = setTimeout(() => runAutosave(), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user, cvId]);

  const runAutosave = async () => {
    if (!user || !cvId) return;
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    setAutoStatus("saving");
    try {
      const title = data.basics.fullName ? `${data.basics.fullName} — CV` : "Untitled CV";
      const { error } = await supabase
        .from("cvs")
        .update({
          title,
          template_id: data.templateId,
          data: JSON.parse(JSON.stringify(data)),
        })
        .eq("id", cvId);
      if (error) throw error;
      setAutoStatus("saved");
    } catch {
      setAutoStatus("error");
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        runAutosave();
      }
    }
  };

  const pickTemplate = (id: string) => {
    if (!canUseTemplate(id)) {
      setUpgradeTpl(id);
      setUpgradeOpen(true);
      return;
    }
    setData((d) => ({ ...d, templateId: id }));
  };

  const updBasics = (k: keyof CvPreviewData["basics"], v: string) =>
    setData((d) => ({ ...d, basics: { ...d.basics, [k]: v } }));

  const addExp = () =>
    setData((d) => ({
      ...d,
      experience: [...d.experience, { id: uid(), role: "", company: "", period: "", description: "" }],
    }));
  const updExp = (id: string, k: string, v: string) =>
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) => (e.id === id ? { ...e, [k]: v } : e)),
    }));
  const rmExp = (id: string) =>
    setData((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== id) }));

  const addEdu = () =>
    setData((d) => ({ ...d, education: [...d.education, { id: uid(), degree: "", school: "", period: "" }] }));
  const updEdu = (id: string, k: string, v: string) =>
    setData((d) => ({
      ...d,
      education: d.education.map((e) => (e.id === id ? { ...e, [k]: v } : e)),
    }));
  const rmEdu = (id: string) =>
    setData((d) => ({ ...d, education: d.education.filter((e) => e.id !== id) }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v || data.skills.includes(v) || data.skills.length >= 30) return;
    setData((d) => ({ ...d, skills: [...d.skills, v] }));
    setSkillInput("");
  };
  const rmSkill = (s: string) =>
    setData((d) => ({ ...d, skills: d.skills.filter((x) => x !== s) }));

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const safe = (data.basics.fullName || "cv").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await downloadCvPdf(data as never, `${safe || "cv"}.pdf`, { watermark: !isPro });
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const grouped = useMemo(() => {
    return {
      Core: TEMPLATES.filter((t) => t.line === "Core"),
      Pro: TEMPLATES.filter((t) => t.line === "Pro"),
      Elite: TEMPLATES.filter((t) => t.line === "Elite"),
    };
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Editor toolbar */}
      <div className="sticky top-16 z-20 border-b border-subtle bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-dim hover:text-foreground">
              <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-soft hidden md:inline">
              Editor · {data.basics.fullName || "Untitled"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dim">
              {autoStatus === "saving" && "Saving…"}
              {autoStatus === "saved" && (<span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-gold" /> Saved</span>)}
              {autoStatus === "error" && <span className="text-red-400">Save failed</span>}
            </span>
            <Button variant="goldOutline" size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_360px] gap-0 min-h-[calc(100vh-8rem)]">
        {/* LEFT — templates */}
        <aside className="border-r border-subtle bg-surface/40 overflow-y-auto max-h-[calc(100vh-8rem)] lg:sticky lg:top-[7.5rem]">
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Templates</p>
            <p className="mt-1 text-xs text-dim">12 designs · live preview</p>
          </div>
          {(["Core", "Pro", "Elite"] as Line[]).map((line) => (
            <div key={line} className="px-5 pb-6">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-soft">{line}</p>
              <div className="grid grid-cols-2 gap-3">
                {grouped[line].map((t) => {
                  const selected = data.templateId === t.id;
                  const locked = !canUseTemplate(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pickTemplate(t.id)}
                      className={`group relative overflow-hidden rounded-md border text-left transition-colors ${
                        selected ? "border-gold" : "border-subtle hover:border-gold/50"
                      }`}
                    >
                      <div className="aspect-[3/4] bg-surface">
                        <img src={t.img} alt={t.name} className="h-full w-full object-cover" />
                        {locked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                            <Lock className="h-4 w-4 text-gold" />
                          </div>
                        )}
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-background">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="px-2 py-1.5 text-[11px] text-foreground">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* CENTER — preview */}
        <main ref={previewWrapRef} className="bg-[#1a1714] dark:bg-[#0E0D0B] overflow-auto p-6 lg:p-10">
          <div className="mx-auto" style={{ width: 793 * scale, height: 1122 * scale }}>
            <CvPreview data={data} scale={scale} />
          </div>
        </main>

        {/* RIGHT — form */}
        <aside className="border-l border-subtle bg-surface/40 overflow-y-auto max-h-[calc(100vh-8rem)] lg:sticky lg:top-[7.5rem]">
          <div className="p-6 space-y-8">
            <section>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-4">Basics</p>
              <div className="grid gap-3">
                <Field label="Full name"><Input value={data.basics.fullName} onChange={(e) => updBasics("fullName", e.target.value)} /></Field>
                <Field label="Headline"><Input value={data.basics.headline} onChange={(e) => updBasics("headline", e.target.value)} placeholder="Senior Product Designer" /></Field>
                <Field label="Email"><Input type="email" value={data.basics.email} onChange={(e) => updBasics("email", e.target.value)} /></Field>
                <Field label="Phone"><Input value={data.basics.phone} onChange={(e) => updBasics("phone", e.target.value)} /></Field>
                <Field label="Location"><Input value={data.basics.location} onChange={(e) => updBasics("location", e.target.value)} /></Field>
                <Field label="Website"><Input value={data.basics.website} onChange={(e) => updBasics("website", e.target.value)} /></Field>
              </div>
            </section>

            <section>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-3">Summary</p>
              <Textarea rows={5} value={data.summary} onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))} />
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Experience</p>
                <Button variant="ghost" size="sm" onClick={addExp} className="text-dim hover:text-foreground"><Plus className="mr-1 h-3 w-3" /> Add</Button>
              </div>
              <div className="space-y-4">
                {data.experience.map((e) => (
                  <div key={e.id} className="rounded-md border border-subtle p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <Input placeholder="Role" value={e.role} onChange={(ev) => updExp(e.id, "role", ev.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => rmExp(e.id)} className="text-dim hover:text-red-400 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Input placeholder="Company" value={e.company} onChange={(ev) => updExp(e.id, "company", ev.target.value)} />
                    <Input placeholder="Period (e.g. 2022 — Present)" value={e.period} onChange={(ev) => updExp(e.id, "period", ev.target.value)} />
                    <Textarea rows={3} placeholder="Impact, metrics, scope…" value={e.description} onChange={(ev) => updExp(e.id, "description", ev.target.value)} />
                  </div>
                ))}
                {data.experience.length === 0 && <p className="text-xs text-dim">No positions yet.</p>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Education</p>
                <Button variant="ghost" size="sm" onClick={addEdu} className="text-dim hover:text-foreground"><Plus className="mr-1 h-3 w-3" /> Add</Button>
              </div>
              <div className="space-y-3">
                {data.education.map((ed) => (
                  <div key={ed.id} className="rounded-md border border-subtle p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <Input placeholder="Degree" value={ed.degree} onChange={(ev) => updEdu(ed.id, "degree", ev.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => rmEdu(ed.id)} className="text-dim hover:text-red-400 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Input placeholder="School" value={ed.school} onChange={(ev) => updEdu(ed.id, "school", ev.target.value)} />
                    <Input placeholder="Year" value={ed.period} onChange={(ev) => updEdu(ed.id, "period", ev.target.value)} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-3">Skills</p>
              <div className="flex gap-2">
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Add a skill" />
                <Button variant="goldOutline" size="sm" onClick={addSkill}>Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <button key={s} onClick={() => rmSkill(s)} className="rounded-sm border border-subtle px-2 py-1 text-[11px] text-dim hover:border-red-400/40 hover:text-red-400">
                    {s} ×
                  </button>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} reason="premium_template" templateId={upgradeTpl} />
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid gap-1.5">
    <Label className="text-[11px] uppercase tracking-[0.18em] text-dim">{label}</Label>
    {children}
  </div>
);

export default Editor;