import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/components/site/AuthProvider";
import { Dialog as InnerDialog, DialogContent as InnerContent, DialogHeader as InnerHeader, DialogTitle as InnerTitle } from "@/components/ui/dialog";

type Reason = "premium_template" | "cv_limit" | "watermark";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: Reason;
  templateId?: string;
}

const COPY: Record<Reason, { title: string; desc: string; bullets: string[] }> = {
  premium_template: {
    title: "This template is Pro",
    desc: "Unlock every premium template — or buy this one forever.",
    bullets: ["All 12 templates", "PDF without watermark", "Unlimited CVs"],
  },
  cv_limit: {
    title: "Free plan limit reached",
    desc: "You can keep one CV on Free. Upgrade to Pro for unlimited.",
    bullets: ["Unlimited CVs", "All premium templates", "PDF without watermark"],
  },
  watermark: {
    title: "Remove the watermark",
    desc: "Pro removes the Profilum watermark from every PDF.",
    bullets: ["Clean PDF export", "Unlimited CVs", "Premium templates"],
  },
};

export function UpgradeDialog({ open, onOpenChange, reason, templateId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openCheckout, closeCheckout, isOpen: stripeOpen, checkoutElement } = useStripeCheckout();
  const c = COPY[reason];

  const goPro = () => {
    if (!user) { navigate("/auth?mode=signup"); return; }
    onOpenChange(false);
    openCheckout({ priceId: "pro_monthly", customerEmail: user.email ?? undefined, userId: user.id });
  };

  const buyTemplate = () => {
    if (!user) { navigate("/auth?mode=signup"); return; }
    onOpenChange(false);
    openCheckout({ priceId: "premium_template", customerEmail: user.email ?? undefined, userId: user.id });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center font-serif text-2xl">{c.title}</DialogTitle>
            <DialogDescription className="text-center">{c.desc}</DialogDescription>
          </DialogHeader>
          <ul className="my-2 space-y-2 text-sm text-dim">
            {c.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" />{b}</li>
            ))}
          </ul>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="gold" size="lg" className="w-full" onClick={goPro}>
              Go Pro — $1.99/mo
            </Button>
            {reason === "premium_template" && templateId && (
              <Button variant="goldOutline" size="lg" className="w-full" onClick={buyTemplate}>
                Own this template — $4.99
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InnerDialog open={stripeOpen} onOpenChange={(v) => { if (!v) closeCheckout(); }}>
        <InnerContent className="max-w-2xl p-0 overflow-hidden">
          <InnerHeader className="border-b border-subtle px-6 py-4">
            <InnerTitle className="font-serif text-xl">Complete your purchase</InnerTitle>
          </InnerHeader>
          <div className="max-h-[80vh] overflow-y-auto bg-white">
            {checkoutElement}
          </div>
        </InnerContent>
      </InnerDialog>
    </>
  );
}
