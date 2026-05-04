import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/site/AuthProvider";
import { useAiRewrite } from "@/hooks/useAiRewrite";
import { toast } from "sonner";

const STAGES = [
  "Analyzing your experience…",
  "Crafting a sharper summary…",
  "Polishing tone & cadence…",
  "Selecting the perfect template…",
];

const MIN_DURATION_MS = 3500;

const BuilderGenerating = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cvId = params.get("id");
  const { user, loading: authLoading } = useAuth();
  const { rewrite } = useAiRewrite();
  const [stage, setStage] = useState(0);
  const startedRef = useRef(false);

  // Stage animator (visual only)
  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => Math.min(STAGES.length - 1, s + 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

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
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const t0 = Date.now();
      try {
        const { data: row, error } = await supabase
          .from("cvs")
          .select("data, template_id")
          .eq("id", cvId)
          .maybeSingle();
        if (error || !row) throw new Error("CV not found");

        const cv = (row.data ?? {}) as {
          basics?: { fullName?: string; headline?: string };
          summary?: string;
          skills?: string[];
          experience?: { role?: string; company?: string; description?: string }[];
        };

        const profile = {
          name: cv.basics?.fullName ?? "",
          role: cv.basics?.headline ?? "",
          industry: "",
          tone: "Professional" as const,
          summary: cv.summary ?? "",
          skills: cv.skills ?? [],
          experience: (cv.experience ?? []).map((e) => ({
            jobTitle: e.role,
            company: e.company,
            description: e.description,
          })),
        };

        const res = await rewrite("summary", profile);
        if (res?.result) {
          const next = { ...cv, summary: res.result.slice(0, 600) };
          await supabase.from("cvs").update({ data: next }).eq("id", cvId);
        }
      } catch (e) {
        console.error(e);
        toast.error("AI generation skipped — continuing to editor.");
      } finally {
        const elapsed = Date.now() - t0;
        const wait = Math.max(0, MIN_DURATION_MS - elapsed);
        setTimeout(() => {
          setStage(STAGES.length - 1);
          setTimeout(() => navigate(`/editor?id=${cvId}`, { replace: true }), 350);
        }, wait);
      }
    };
    run();
  }, [authLoading, user, cvId, navigate, rewrite]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
        <div className="w-full max-w-xl text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold">
            <Sparkles className="h-3 w-3" /> Profilum AI
          </div>
          <h1 className="mt-6 font-serif text-4xl md:text-5xl">
            Crafting your <span className="italic text-gold">premium</span> CV.
          </h1>
          <p className="mt-4 text-sm text-dim">
            A few seconds of quiet brilliance. Don't refresh.
          </p>

          <div className="mt-12 rounded-md border border-subtle bg-surface p-8 text-left">
            <ul className="space-y-4">
              {STAGES.map((label, i) => {
                const done = i < stage;
                const active = i === stage;
                return (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        done
                          ? "border-gold bg-gold text-background"
                          : active
                          ? "border-gold text-gold"
                          : "border-subtle text-dim"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[10px]">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className={`text-sm ${
                        done ? "text-foreground" : active ? "text-foreground" : "text-dim"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 h-px w-full bg-border-subtle">
              <div
                className="h-px bg-gold transition-all duration-500"
                style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BuilderGenerating;