import { Link, useSearchParams } from "react-router-dom";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="container flex flex-col items-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-serif text-4xl md:text-5xl">Thank you</h1>
        <p className="mt-3 max-w-md text-dim">
          {sessionId
            ? "Your payment has been received. Your account is being updated — this usually takes a few seconds."
            : "No session information found."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold">
            <Link to="/dashboard">Go to my CVs</Link>
          </Button>
          <Button asChild variant="goldOutline">
            <Link to="/builder">Start a new CV</Link>
          </Button>
        </div>
        {sessionId && (
          <p className="mt-8 text-[10px] uppercase tracking-widest text-dim">
            Ref · {sessionId.slice(0, 24)}…
          </p>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default CheckoutReturn;