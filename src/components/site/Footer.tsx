import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-subtle bg-surface/40 mt-32">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="font-serif text-2xl">
              Profilum<span className="text-gold">.</span>
            </span>
            <p className="mt-4 max-w-sm text-sm text-dim leading-relaxed">
              Your professional identity, elevated by AI. Premium CVs that open doors.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-soft mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-dim">
              <li><Link to="/templates" className="hover:text-foreground">Templates</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/builder" className="hover:text-foreground">CV builder</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted-soft mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-dim">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-subtle flex flex-col gap-3 md:flex-row md:justify-between text-xs text-muted-soft">
          <span>© 2026 Profilum. Crafted with intention.</span>
          <span>Powered by AI</span>
        </div>
      </div>
    </footer>
  );
};