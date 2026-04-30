import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

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

type Template = {
  id: string;
  name: string;
  line: Line;
  img: string;
  desc: string;
  best: string;
  tags: string[];
};

const templates: Template[] = [
  { id: "blanc", name: "Blanc", line: "Core", img: tplBlanc, desc: "Minimal. ATS-perfect. Always works.", best: "Any role, any industry", tags: ["minimal", "ats"] },
  { id: "ivory", name: "Ivory", line: "Core", img: tplIvory, desc: "Warm cream paper, single column, classic serif.", best: "Editorial, NGO, education", tags: ["classic", "serif"] },
  { id: "nord", name: "Nord", line: "Core", img: tplNord, desc: "Confident two-column with a calm header.", best: "Operations, project management", tags: ["two-column"] },
  { id: "linea", name: "Linea", line: "Core", img: tplLinea, desc: "Architectural whitespace. Quiet authority.", best: "Architecture, design, consulting", tags: ["minimal"] },
  { id: "obsidian", name: "Obsidian", line: "Pro", img: tplObsidian, desc: "Dark, gold-accented, executive.", best: "Senior leadership", tags: ["dark", "executive"] },
  { id: "noir", name: "Noir", line: "Pro", img: tplNoir, desc: "Charcoal & gold, two-column gravitas.", best: "Finance, law, executive search", tags: ["dark", "two-column"] },
  { id: "oxford", name: "Oxford", line: "Pro", img: tplOxford, desc: "Scholarly elegance with a publications block.", best: "Academia, research, PhD", tags: ["academic"] },
  { id: "mercer", name: "Mercer", line: "Pro", img: tplMercer, desc: "Tech-forward sidebar with skill bars.", best: "Engineering, product, data", tags: ["tech", "modern"] },
  { id: "sterling", name: "Sterling", line: "Pro", img: tplSterling, desc: "Navy header, conservative, banker-grade.", best: "Banking, M&A, consulting", tags: ["formal"] },
  { id: "atelier", name: "Atelier", line: "Elite", img: tplAtelier, desc: "Asymmetric editorial grid with a color block.", best: "Creative direction, brand, design", tags: ["creative", "editorial"] },
  { id: "rose", name: "Rosé", line: "Elite", img: tplRose, desc: "Blush & gold, fashion-house refinement.", best: "Fashion, beauty, hospitality", tags: ["editorial", "luxury"] },
  { id: "aurum", name: "Aurum", line: "Elite", img: tplAurum, desc: "Black & gold statement piece.", best: "Founders, C-suite, marquee roles", tags: ["dark", "statement"] },
];

const filters: ("All" | Line)[] = ["All", "Core", "Pro", "Elite"];

const lineDescription: Record<Line, string> = {
  Core: "Included in every plan",
  Pro: "Pro & Elite plans",
  Elite: "Elite plan only",
};

const Templates = () => {
  const [active, setActive] = useState<(typeof filters)[number]>("All");

  const filtered = useMemo(
    () => (active === "All" ? templates : templates.filter((t) => t.line === active)),
    [active]
  );

  const counts = useMemo(
    () => ({
      All: templates.length,
      Core: templates.filter((t) => t.line === "Core").length,
      Pro: templates.filter((t) => t.line === "Pro").length,
      Elite: templates.filter((t) => t.line === "Elite").length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Header */}
      <section className="container pt-20 pb-10 md:pt-28 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-gold">The collection</span>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl tracking-tight">
          Twelve templates. <span className="text-gradient-gold italic">One voice yours.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-dim">
          Every template is hand-tuned for typographic balance, ATS parsing and
          on-screen elegance. Choose one — or own it forever for $12.
        </p>
      </section>

      {/* Filter bar */}
      <section className="container pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-subtle py-5">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors ${
                  active === f
                    ? "border-gold bg-gold text-background"
                    : "border-subtle text-dim hover:border-gold/50 hover:text-foreground"
                }`}
              >
                {f}
                <span
                  className={`text-[10px] tracking-normal ${
                    active === f ? "text-background/70" : "text-muted-soft"
                  }`}
                >
                  {counts[f as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
          {active !== "All" && (
            <span className="text-xs uppercase tracking-[0.2em] text-muted-soft">
              {lineDescription[active as Line]}
            </span>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="container pb-24">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <article key={t.id} className="group">
              <Link to={`/builder?template=${t.id}`} className="block">
                <div className="relative overflow-hidden rounded-md border border-subtle bg-surface aspect-[3/4]">
                  <img
                    src={t.img}
                    alt={`${t.name} CV template preview`}
                    loading="lazy"
                    width={768}
                    height={1024}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute top-4 left-4 rounded-sm border border-gold/40 bg-background/70 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gold">
                    {t.line}
                  </span>
                  <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-2 rounded-sm bg-gold px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-background">
                      Use template <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>

              <div className="mt-5 flex items-baseline justify-between">
                <h2 className="font-serif text-2xl">{t.name}</h2>
                <span className="text-xs text-muted-soft">{t.id}</span>
              </div>
              <p className="mt-1 text-sm text-dim">{t.desc}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-soft">
                Best for · <span className="text-dim normal-case tracking-normal">{t.best}</span>
              </p>

              <div className="mt-5 flex items-center gap-3">
                <Button variant="goldOutline" size="sm" asChild>
                  <Link to={`/builder?template=${t.id}`}>Use template</Link>
                </Button>
                <Link
                  to={`/checkout?template=${t.id}&type=own`}
                  className="text-xs text-dim hover:text-gold transition-colors"
                >
                  Own it · $12
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-dim py-24">No templates in this category yet.</p>
        )}
      </section>

      {/* Plan tiers explainer */}
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {(["Core", "Pro", "Elite"] as Line[]).map((line) => (
            <div key={line} className="rounded-md border border-subtle bg-surface/60 p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-gold">{line}</div>
              <h3 className="mt-3 font-serif text-3xl">
                {counts[line]} templates
              </h3>
              <p className="mt-2 text-sm text-dim">{lineDescription[line]}</p>
              <ul className="mt-5 space-y-2 text-sm text-dim">
                {templates
                  .filter((t) => t.line === line)
                  .map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-gold" /> {t.name}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-32">
        <div className="rounded-md border border-gold/30 bg-surface p-12 md:p-16 text-center glow-gold">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
            <Sparkles className="h-3 w-3" /> Powered by Claude AI
          </div>
          <h2 className="mt-5 font-serif text-4xl md:text-5xl">
            Pick a template. We'll write the words.
          </h2>
          <p className="mt-4 text-dim max-w-md mx-auto">
            Drop your old CV or start blank. Claude rewrites every bullet into
            quantified, ATS-optimised impact.
          </p>
          <Button variant="hero" size="xl" className="mt-10" asChild>
            <Link to="/builder">Start from $1.99 <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Templates;