import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function AiRewriteButton({ onClick, loading, disabled, label = "Rewrite with AI", className }: Props) {
  return (
    <Button
      type="button"
      variant="goldOutline"
      size="sm"
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
