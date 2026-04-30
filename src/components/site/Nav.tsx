import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
  { to: "/templates", label: "Templates" },
];

export const Nav = () => {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-50 border-b border-subtle bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-tight text-foreground">
            Profilum<span className="text-gold">.</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm tracking-wide transition-colors hover:text-foreground ${
                pathname === l.to ? "text-foreground" : "text-dim"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-dim hover:text-foreground" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link to="/builder">Build my CV</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};