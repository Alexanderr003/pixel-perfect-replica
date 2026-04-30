import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-9 w-[68px] items-center rounded-full border border-gold/40 bg-surface transition-colors hover:border-gold"
    >
      {/* Track icons */}
      <span className="absolute left-2 flex h-5 w-5 items-center justify-center text-gold">
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span className="absolute right-2 flex h-5 w-5 items-center justify-center text-gold">
        <Moon className="h-3.5 w-3.5" />
      </span>
      {/* Knob */}
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full gradient-gold shadow-md transition-transform duration-300 ease-out ${
          isDark ? "translate-x-[34px]" : "translate-x-1"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-background" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-background" />
        )}
      </span>
    </button>
  );
};