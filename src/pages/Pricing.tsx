import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

type Billing = "monthly" | "yearly";

const plans = (billing: Billing) => [
  {
    name: "Starter",
    tagline: "Try the experience.",
    price: "$1.99",
    sub: "one-time",
    features: ["1 CV", "4 Core templates", "PDF download", "Basic AI rewrite"],
    cta: "Start with $1.99",
  },
  {
    name: "Pro",
    tagline: "For serious job seekers.",
    price: billing === "monthly" ? "$9" : "$70",
    sub: billing === "monthly" ? "per month" : "per year · save $38",
    features: [
      "Unlimited CVs",
      "9 templates (Core + Pro)",
      "Cover letter generator",
      "LinkedIn bio optimiser",
      "Job match dashboard",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Elite",
    tagline: "The full studio.",
    price: billing === "monthly" ? "$19" : "$148",
    sub: billing === "monthly" ? "per month" : "per year · save $80",
    features: [
      "Everything in Pro",
      "All 12 premium templates",
      "AI headshot generator",
      "Priority support",
      "Early access to new templates",
    ],
    cta: "Go Elite",
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings in one click. You keep access until the end of the billing period.",
  },
  {
    q: "What does 'Own a template' mean?",
    a: "Pay $12 once and a single template is yours forever. Use it for unlimited CVs, even after canceling any subscription.",
  },
  {
    q: "Are the CVs ATS-friendly?",
    a: "Every template is built and tested against major ATS parsers. Claude also adds industry-specific keywords automatically.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — a 7-day no-questions-asked guarantee on every plan. Email us and we refund.",
  },
  {
    q: "Do you store my data?",
    a: "Your CV data is stored encrypted. You can delete everything from your account at any time.",
  },
];

const Pricing = () => {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const items = plans(billing);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <section className="container pt-20 pb-12 md:pt-28 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-gold">Pricing</span>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl tracking-tight">
          Simple. Transparent. Premium.
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-dim">
          Pay once for a single CV, or unlock the entire studio with a monthly plan.
          No hidden fees. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="mt-10 inline-flex rounded-md border border-subtle bg-surface p-1">
          {(["monthly", "yearly"] as Billing[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`relative px-5 py-2 text-xs uppercase tracking-[0.2em] rounded-sm transition-colors ${
                billing === b
                  ? "bg-gold text-background"
                  : "text-dim hover:text-foreground"
              }`}
            >
              {b}
              {b === "yearly" && (
                <span className="ml-2 text-[9px] text-gold-light">save 35%</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="container pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-md border p-8 flex flex-col ${
                p.featured
                  ? "border-gold/50 bg-surface glow-gold"
                  : "border-subtle bg-surface/60"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-8 rounded-sm bg-gold px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-background">
                  Most chosen
                </span>
              )}
              <div className="text-xs uppercase tracking-[0.2em] text-muted-soft">{p.name}</div>
              <p className="mt-2 text-sm text-dim">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-6xl text-foreground">{p.price}</span>
              </div>
              <div className="text-xs text-dim">{p.sub}</div>

              <ul className="mt-8 space-y-3 text-sm text-dim flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={p.featured ? "gold" : "goldOutline"}
                size="lg"
                className="mt-8"
                asChild
              >
                <Link to="/checkout">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Own a template */}
      <section className="container pb-24">
        <div className="rounded-md border border-gold/30 bg-surface p-10 md:p-14 grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" /> One-time, forever
            </div>
            <h2 className="mt-5 font-serif text-4xl md:text-5xl">Own a template — $12</h2>
            <p className="mt-4 text-dim max-w-lg">
              Pick any single template and make it yours forever. Unlimited uses,
              all future style updates, no subscription required.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-dim">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gold" /> Choose any of the 12 templates
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gold" /> Unlimited CVs with that template
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gold" /> Lifetime style updates
              </li>
            </ul>
          </div>
          <div className="text-center md:text-right">
            <div className="font-serif text-7xl text-gradient-gold">$12</div>
            <div className="text-xs text-dim mt-2">paid once</div>
            <Button variant="gold" size="xl" className="mt-6" asChild>
              <Link to="/templates">Choose a template</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-32">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs uppercase tracking-[0.25em] text-gold">FAQ</span>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">Questions, answered.</h2>
          </div>
          <div className="mt-12 divide-y divide-subtle border-y border-subtle">
            {faqs.map((f, i) => (
              <button
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left py-6 group"
              >
                <div className="flex items-center justify-between gap-6">
                  <span className="font-serif text-xl text-foreground">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gold transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openFaq === i && (
                  <p className="mt-4 text-dim leading-relaxed pr-8">{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;