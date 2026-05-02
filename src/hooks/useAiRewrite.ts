import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RewriteType = "summary" | "bullets" | "cover_letter" | "linkedin_bio";

export interface RewriteProfile {
  name?: string;
  role?: string;
  industry?: string;
  tone?: "Professional" | "Modern" | "Creative";
  summary?: string;
  skills?: string[];
  experience?: { jobTitle?: string; company?: string; description?: string }[];
}

export interface RewriteResult {
  result: string;
  creditsRemaining: number | null;
  isPro: boolean;
  isElite: boolean;
}

export function useAiRewrite() {
  const [loading, setLoading] = useState(false);

  const rewrite = async (
    type: RewriteType,
    profile: RewriteProfile,
    options?: { jobIndex?: number; onNoCredits?: () => void }
  ): Promise<RewriteResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite", {
        body: { type, profile, jobIndex: options?.jobIndex },
      });
      if (error) {
        // FunctionsHttpError: try to read message
        const status = (error as { context?: { status?: number } }).context?.status;
        if (status === 402) {
          options?.onNoCredits?.();
          return null;
        }
        if (status === 401) {
          toast.error("Please sign in to use AI features.");
          return null;
        }
        toast.error("AI request failed. Try again.");
        return null;
      }
      if (data?.error === "no_credits") {
        options?.onNoCredits?.();
        return null;
      }
      if (!data?.result) {
        toast.error("Empty response from AI.");
        return null;
      }
      return data as RewriteResult;
    } catch (e) {
      console.error(e);
      toast.error("Network error. Try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { rewrite, loading };
}
