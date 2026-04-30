import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, FileText, Zap, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import tplBlanc from "@/assets/template-blanc.jpg";
import tplObsidian from "@/assets/template-obsidian.jpg";
import tplNord from "@/assets/template-nord.jpg";

const templates = [
  { id: "blanc", name: "Blanc", line: "Core", img: tplBlanc, desc: "Minimal. ATS-perfect. Always works." },
  { id: "obsidian", name: "Obsidian", line: "Pro", img: tplObsidian, desc: "Dark, gold-accented, executive." },
  { id: "nord", name: "Nord", line: "Core", img: tplNord, desc: "Confident two-column with navy header." },
];

const plans = [
  { name: "Starter", price: "$2", sub: "one-time", features: ["1 CV", "4 Core templates", "PDF download"], cta: "Get started" },
  { name: "Pro", price: "$9", sub: "per month", features: ["Unlimited CVs", "9 templates", "Cover letter & LinkedIn bio", "Job match dashboard"], cta: "Go Pro", featured: true },
  { name: "Elite", price: "$19", sub: "per month", features: ["Everything in Pro", "All 12 templates", "AI headshot", "Priority support"], cta: "Go Elite" },
  { name: "Own a template", price: "$12", sub: "one-time", features: ["1 template forever", "Unlimited uses", "All future updates"], cta: "Buy template" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="container relative pt-28 pb-32 md:pt-40 md:pb-48">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" />
              Powered by Claude AI
            </div>
            <h1 className="mt-8 font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              Your profile.
              <br />
              <span className="text-gradient-gold italic">Elevated.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-dim md:text-xl">
              Profilum turns your story into a CV that opens doors. Twelve premium
              templates. Words written by AI. Polished in minutes.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/builder">
                  Build my CV — from $2 <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button variant="ghost" size="xl" className="text-dim" asChild>
                <Link to="/templates">View templates</Link>
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-muted-soft">
              <span className="flex items-center gap-2">
                <span className="h-px w-8 bg-gold/40" /> ATS optimised
              </span>
              <span className="flex items-center gap-2">
                <span className="h-px w-8 bg-gold/40" /> 12 templates
              </span>
              <span className="hidden md:flex items-center gap-2">
                <span className="h-px w-8 bg-gold/40" /> 7-day guarantee
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AI SECTION — before / after */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-gold">The AI difference</span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">
            From a draft to a definitive statement.
          </h2>
          <p className="mt-4 text-dim">
            Claude rewrites your raw experience into impact-driven language tuned to
            your target role and industry.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-md border border-subtle bg-surface p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-soft">Before</div>
            <p className="mt-6 text-dim leading-relaxed">
              "Worked on the marketing team. Helped with campaigns and made some
              social media posts. Did some analytics too."
            </p>
          </div>
          <div className="rounded-md border border-gold/30 bg-surface p-8 glow-gold">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" /> After — by Claude
            </div>
            <ul className="mt-6 space-y-3 text-foreground/90 leading-relaxed">
              <li>• Led 14 multi-channel campaigns generating $2.3M in attributed pipeline.</li>
              <li>• Grew organic social following 240% in 9 months across LinkedIn and X.</li>
              <li>• Built attribution dashboards that cut reporting time by 70%.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* TEMPLATES PREVIEW */}
      <section className="container py-24 md:py-32 border-t border-subtle">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold">The collection</span>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">Twelve templates. One for every chapter.</h2>
          </div>
          <Link to="/templates" className="text-sm text-dim hover:text-gold transition-colors">
            View all twelve →
          </Link>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="group">
              <div className="relative overflow-hidden rounded-md border border-subtle bg-surface aspect-[3/4]">
                <img
                  src={t.img}
                  alt={`${t.name} CV template`}
                  loading="lazy"
                  width={800}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute top-4 left-4 rounded-sm border border-gold/30 bg-background/70 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gold">
                  {t.line}
                </span>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <h3 className="font-serif text-2xl">{t.name}</h3>
                <span className="text-xs text-muted-soft">{t.id}</span>
              </div>
              <p className="mt-1 text-sm text-dim">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES TRIO */}
      <section className="container py-24 border-t border-subtle">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            { icon: FileText, title: "Import in one click", body: "Drop a PDF or DOCX. We extract everything and pre-fill your form." },
            { icon: Sparkles, title: "Written by Claude", body: "Quantified bullets, ATS keywords, cover letter and LinkedIn bio." },
            { icon: Zap, title: "PDF in seconds", body: "Pixel-perfect, A4, embedded fonts. Ready for the recruiter inbox." },
          ].map((f) => (
            <div key={f.title}>
              <f.icon className="h-5 w-5 text-gold" />
              <h3 className="mt-5 font-serif text-2xl">{f.title}</h3>
              <p className="mt-3 text-dim leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="container py-24 md:py-32 border-t border-subtle">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Pricing</span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">Pay for what you actually need.</h2>
          <p className="mt-4 text-dim">Start at two dollars. Own a template forever for twelve. Or go unlimited.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-md border p-8 transition-colors ${
                p.featured
                  ? "border-gold/50 bg-surface glow-gold"
                  : "border-subtle bg-surface/60 hover:border-gold/30"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-8 rounded-sm bg-gold px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-background">
                  Most chosen
                </span>
              )}
              <div className="text-xs uppercase tracking-[0.2em] text-muted-soft">{p.name}</div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-foreground">{p.price}</span>
                <span className="text-sm text-dim">{p.sub}</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-dim">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={p.featured ? "gold" : "goldOutline"}
                className="mt-8 w-full"
                asChild
              >
                <Link to="/pricing">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL / CLOSING */}
      <section className="container py-32 border-t border-subtle">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gold" />
            ))}
          </div>
          <blockquote className="mt-8 font-serif text-3xl md:text-4xl leading-snug text-foreground italic">
            "I sent three CVs in a Tuesday afternoon and had two interviews by
            Friday. Profilum doesn't make CVs — it makes statements."
          </blockquote>
          <div className="mt-8 text-sm text-dim">
            Ana C. — Product Lead, formerly at Spotify
          </div>
        </div>

        <div className="mt-24 rounded-md border border-gold/30 bg-surface p-12 md:p-16 text-center glow-gold">
          <h2 className="font-serif text-4xl md:text-5xl">Begin your next chapter.</h2>
          <p className="mt-4 text-dim max-w-md mx-auto">
            Two dollars for your first CV. No subscription. No credit card surprises.
          </p>
          <Button variant="hero" size="xl" className="mt-10" asChild>
            <Link to="/builder">Build my CV <ArrowRight className="ml-1" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;