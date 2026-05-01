import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/components/site/AuthProvider";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { CvPreview } from "@/components/cv/CvPreview";
import type { CvPreviewData } from "@/components/cv/CvPreview";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Experience = { id: string; role: string; company: string; period: string; description: string };
type Education = { id: string; degree: string; school: string; period: string };

type CvData = {
  basics: { fullName: string; headline: string; email: string; phone: string; location: string; website: string };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  templateId: string;
};

const emptyData: CvData = {
  basics: { fullName: "", headline: "", email: "", phone: "", location: "", website: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  templateId: "ivory",
};

const templates = [
  { id: "ivory", name: "Ivory", line: "Core" },
  { id: "blanc", name: "Blanc", line: "Core" },
  { id: "nord", name: "Nord", line: "Core" },
  { id: "obsidian", name: "Obsidian", line: "Pro" },
  { id: "noir", name: "Noir", line: "Pro" },
  { id: "aurum", name: "Aurum", line: "Elite" },
];

const steps = ["Basics", "Experience", "Education & skills", "Template"] as const;

const basicsSchema = z.object({
  fullName: z.string().trim().min(1, "Name required").max(100),
  headline: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(100).optional(),
  website: z.string().trim().max(255).optional(),
});

const uid = () => Math.random().toString(36).slice(2, 10);

const Builder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CvData>(emptyData);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Prefill name from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data: p }) => {
        if (p?.full_name) {
          setData((d) => ({ ...d, basics: { ...d.basics, fullName: p.full_name ?? "", email: user.email ?? "" } }));
        } else {
          setData((d) => ({ ...d, basics: { ...d.basics, email: user.email ?? "" } }));
        }
      });
  }, [user]);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const next = () => {
    if (step === 0) {
      const parsed = basicsSchema.safeParse(data.basics);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Please complete required fields");
        return;
      }
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const addExperience = () =>
    setData((d) => ({
      ...d,
      experience: [...d.experience, { id: uid(), role: "", company: "", period: "", description: "" }],
    }));
  const updateExperience = (id: string, field: keyof Experience, value: string) =>
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  const removeExperience = (id: string) =>
    setData((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== id) }));

  const addEducation = () =>
    setData((d) => ({ ...d, education: [...d.education, { id: uid(), degree: "", school: "", period: "" }] }));
  const updateEducation = (id: string, field: keyof Education, value: string) =>
    setData((d) => ({
      ...d,
      education: d.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  const removeEducation = (id: string) =>
    setData((d) => ({ ...d, education: d.education.filter((e) => e.id !== id) }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v || data.skills.includes(v) || data.skills.length >= 30) return;
    setData((d) => ({ ...d, skills: [...d.skills, v] }));
    setSkillInput("");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const title = data.basics.fullName ? `${data.basics.fullName} — CV` : "Untitled CV";
      const { error } = await supabase.from("cvs").insert([
        {
          user_id: user.id,
          title,
          template_id: data.templateId,
          data: JSON.parse(JSON.stringify(data)),
        },
      ]);
      if (error) throw error;
      toast.success("CV saved.");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="container py-10 md:py-14">
        {/* Stepper */}
        <div className="mb-8 max-w-4xl">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-dim">
            <span>Step {step + 1} of {steps.length}</span>
            <span className="text-gold">{steps[step]}</span>
          </div>
          <div className="mt-3 h-px w-full bg-border-subtle">
            <div
              className="h-px bg-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 hidden md:flex items-center justify-between">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                    i < step
                      ? "border-gold bg-gold text-primary-foreground"
                      : i === step
                      ? "border-gold text-gold"
                      : "border-subtle text-dim"
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-xs ${i === step ? "text-foreground" : "text-dim"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* LEFT — form column */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-serif text-4xl text-foreground md:text-5xl">{steps[step]}</h1>
              {/* Mobile preview trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="goldOutline" size="sm" className="lg:hidden">
                    <Eye className="mr-2 h-4 w-4" /> Preview
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full overflow-auto bg-background p-4 sm:max-w-xl">
                  <PreviewPane data={data} />
                </SheetContent>
              </Sheet>
            </div>

            <div className="mt-6 rounded-lg border border-subtle bg-surface p-6 md:p-8">
          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name *" id="fullName">
                <Input
                  id="fullName"
                  value={data.basics.fullName}
                  onChange={(e) => setData({ ...data, basics: { ...data.basics, fullName: e.target.value } })}
                  placeholder="Ada Lovelace"
                />
              </Field>
              <Field label="Headline" id="headline">
                <Input
                  id="headline"
                  value={data.basics.headline}
                  onChange={(e) => setData({ ...data, basics: { ...data.basics, headline: e.target.value } })}
                  placeholder="Senior Product Designer"
                />
              </Field>
              <Field label="Email *" id="email">
                <Input
                  id="email"
                  type="email"
                  value={data.basics.email}
                  onChange={(e) => setData({ ...data, basics: { ...data.basics, email: e.target.value } })}
                />
              </Field>
              <Field label="Phone" id="phone">
                <Input
                  id="phone"
                  value={data.basics.phone}
                  onChange={(e) => setData({ ...data, basics: { ...data.basics, phone: e.target.value } })}
                />
              </Field>
              <Field label="Location" id="location">
                <Input
                  id="location"
                  value={data.basics.location}
                  onChange={(e) => setData({ ...data, basics: { ...data.basics, location: e.target.value } })}
                  placeholder="Madrid, ES"
                />
              </Field>
              <Field label="Website" id="website">
                <Input
                  id="website"
                  value={data.basics.website}
                  onChange={(e) => setData({ ...data, basics: { ...data.basics, website: e.target.value } })}
                  placeholder="https://"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Professional summary" id="summary">
                  <Textarea
                    id="summary"
                    rows={4}
                    value={data.summary}
                    onChange={(e) => setData({ ...data, summary: e.target.value.slice(0, 600) })}
                    placeholder="A short paragraph that captures who you are and what you do."
                  />
                  <p className="mt-1 text-xs text-dim">{data.summary.length}/600</p>
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6">
              {data.experience.length === 0 && (
                <p className="text-sm text-dim">No roles yet. Add your most recent first.</p>
              )}
              {data.experience.map((exp, idx) => (
                <div key={exp.id} className="rounded-md border border-subtle bg-background/40 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-dim">Role {idx + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)}>
                      <Trash2 className="h-4 w-4 text-dim" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Role" id={`role-${exp.id}`}>
                      <Input
                        id={`role-${exp.id}`}
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                      />
                    </Field>
                    <Field label="Company" id={`company-${exp.id}`}>
                      <Input
                        id={`company-${exp.id}`}
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Period" id={`period-${exp.id}`}>
                        <Input
                          id={`period-${exp.id}`}
                          value={exp.period}
                          onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                          placeholder="Jan 2022 — Present"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Description" id={`desc-${exp.id}`}>
                        <Textarea
                          id={`desc-${exp.id}`}
                          rows={3}
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, "description", e.target.value.slice(0, 600))}
                          placeholder="Key wins, scope, impact."
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="goldOutline" onClick={addExperience}>
                <Plus className="mr-2 h-4 w-4" /> Add role
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-8">
              <div>
                <h3 className="font-serif text-2xl text-foreground">Education</h3>
                <div className="mt-4 grid gap-4">
                  {data.education.length === 0 && <p className="text-sm text-dim">No entries yet.</p>}
                  {data.education.map((ed, idx) => (
                    <div key={ed.id} className="rounded-md border border-subtle bg-background/40 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-dim">Entry {idx + 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeEducation(ed.id)}>
                          <Trash2 className="h-4 w-4 text-dim" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Degree" id={`degree-${ed.id}`}>
                          <Input
                            id={`degree-${ed.id}`}
                            value={ed.degree}
                            onChange={(e) => updateEducation(ed.id, "degree", e.target.value)}
                          />
                        </Field>
                        <Field label="School" id={`school-${ed.id}`}>
                          <Input
                            id={`school-${ed.id}`}
                            value={ed.school}
                            onChange={(e) => updateEducation(ed.id, "school", e.target.value)}
                          />
                        </Field>
                        <div className="md:col-span-2">
                          <Field label="Period" id={`eduperiod-${ed.id}`}>
                            <Input
                              id={`eduperiod-${ed.id}`}
                              value={ed.period}
                              onChange={(e) => updateEducation(ed.id, "period", e.target.value)}
                              placeholder="2018 — 2022"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="goldOutline" onClick={addEducation}>
                    <Plus className="mr-2 h-4 w-4" /> Add education
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-foreground">Skills</h3>
                <div className="mt-4 flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type a skill and press Enter"
                    maxLength={40}
                  />
                  <Button variant="goldOutline" onClick={addSkill}>Add</Button>
                </div>
                {data.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.skills.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setData({ ...data, skills: data.skills.filter((x) => x !== s) })}
                        className="group rounded-full border border-subtle bg-surface-2 px-3 py-1 text-xs text-foreground hover:border-gold"
                      >
                        {s} <span className="ml-1 text-dim group-hover:text-gold">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-dim">Pick a template. You can change it later.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {templates.map((t) => {
                  const active = data.templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setData({ ...data, templateId: t.id })}
                      className={`group relative rounded-lg border p-5 text-left transition-all ${
                        active ? "border-gold bg-surface-2 shadow-glow" : "border-subtle bg-surface hover:border-gold/50"
                      }`}
                    >
                      <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-background/60">
                        <span className="font-serif text-4xl text-gold/60">{t.name[0]}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="font-serif text-lg text-foreground">{t.name}</p>
                          <p className="text-xs uppercase tracking-widest text-dim">{t.line}</p>
                        </div>
                        {active && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

            </div>

            {/* Nav buttons */}
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={prev} disabled={step === 0 || saving} className="text-dim hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < steps.length - 1 ? (
                <Button variant="gold" onClick={next}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="gold" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save CV
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT — live preview (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-dim">Live preview</span>
                <span className="text-xs text-gold">{data.templateId}</span>
              </div>
              <PreviewPane data={data} />
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
};

const A4_WIDTH_PX = 794; // 210mm @ 96dpi
const A4_HEIGHT_PX = 1123; // 297mm @ 96dpi

const PreviewPane = ({ data }: { data: CvPreviewData }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(w / A4_WIDTH_PX);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface-2 p-3">
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-background/40"
        style={{ height: A4_HEIGHT_PX * scale }}
      >
        <div className="absolute left-0 top-0">
          <CvPreview data={data} scale={scale} />
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, id, children }: { label: string; id: string; children: React.ReactNode }) => (
  <div className="grid gap-2">
    <Label htmlFor={id} className="text-xs uppercase tracking-widest text-dim">{label}</Label>
    {children}
  </div>
);

export default Builder;