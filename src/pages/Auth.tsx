import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/components/site/AuthProvider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  fullName: z.string().trim().max(100).optional(),
});

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const from = (location.state as { from?: string } | null)?.from ?? "/builder";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName: mode === "signup" ? fullName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg.includes("Invalid login") ? "Wrong email or password" : msg);
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/builder",
    });
    if (result.error) {
      toast.error("Could not sign in with " + provider);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="font-serif text-4xl text-foreground md:text-5xl">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-3 text-sm text-dim">
              {mode === "signin" ? "Sign in to continue building." : "Start crafting your CV in minutes."}
            </p>
          </div>

          <div className="mt-10 rounded-lg border border-subtle bg-surface p-8">
            <div className="grid gap-3">
              <Button
                type="button"
                variant="goldOutline"
                size="lg"
                onClick={() => oauth("google")}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
              </Button>
              <Button
                type="button"
                variant="goldOutline"
                size="lg"
                onClick={() => oauth("apple")}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Apple"}
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-xs uppercase tracking-widest text-dim">or</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <form onSubmit={submit} className="grid gap-4">
              {mode === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
              <Button type="submit" variant="gold" size="lg" disabled={loading || !!oauthLoading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-dim">
              {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-gold hover:underline"
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-dim">
            By continuing you agree to our <Link to="/" className="underline">Terms</Link>.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Auth;