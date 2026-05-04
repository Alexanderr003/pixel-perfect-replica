import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import { LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
  { to: "/templates", label: "Templates" },
];

const authedLinks = [
  { to: "/dashboard", label: "My CVs" },
  { to: "/pricing", label: "Pricing" },
  { to: "/templates", label: "Templates" },
];

export const Nav = () => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-subtle bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-[0.2em] text-foreground">
            <span className="text-gold">P.</span>ROFILUM
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {(user ? authedLinks : links).map((l) => (
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
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-dim hover:text-foreground" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link to="/builder">Build my CV</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-dim hover:text-foreground" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link to="/builder">Build my CV</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};