import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type RewriteType = "summary" | "bullets" | "cover_letter" | "linkedin_bio";

interface ProfileInput {
  name?: string;
  role?: string;
  industry?: string;
  tone?: "Professional" | "Modern" | "Creative";
  summary?: string;
  skills?: string[];
  experience?: { jobTitle?: string; company?: string; description?: string }[];
}

interface Body {
  type: RewriteType;
  profile: ProfileInput;
  jobIndex?: number;
}

function buildPrompt(body: Body): { system: string; user: string } {
  const p = body.profile ?? {};
  const tone = p.tone ?? "Professional";
  const name = p.name ?? "";
  const role = p.role ?? "";
  const industry = p.industry ?? "";
  const top5 = (p.skills ?? []).slice(0, 5).join(", ");
  const top4 = (p.skills ?? []).slice(0, 4).join(", ");

  switch (body.type) {
    case "summary":
      return {
        system: `You are an expert CV writer. Write in a ${tone} tone. Be concise, impactful, ATS-optimised. No fluff.`,
        user: `Write a 3-sentence professional summary for a CV.
Name: ${name}. Role: ${role}. Industry: ${industry}.
Background: ${p.summary ?? ""}.
Skills: ${top5}.
Return only the summary text, no labels, no markdown.`,
      };
    case "bullets": {
      const idx = Math.max(0, Math.min((body.jobIndex ?? 0), (p.experience?.length ?? 1) - 1));
      const job = (p.experience ?? [])[idx] ?? {};
      return {
        system:
          "You are an expert CV writer. Write powerful, quantified, ATS-optimised bullet points. Each must start with a strong action verb and include a measurable result.",
        user: `Write 3 strong CV bullet points for this experience.
Job: ${job.jobTitle ?? ""} at ${job.company ?? ""}.
Description: ${job.description ?? ""}.
Industry: ${industry}. Tone: ${tone}.
Return only 3 bullets, one per line, each starting with •`,
      };
    }
    case "cover_letter":
      return {
        system: `You are an expert CV writer. Write in a ${tone} tone. Be concise, compelling, human-feeling. Never robotic.`,
        user: `Write a 3-sentence cover letter opening paragraph for ${name} applying as ${role} in ${industry}.
Key strengths: ${top4}.
Return only the paragraph, no greeting, no signature.`,
      };
    case "linkedin_bio":
      return {
        system:
          "Write concise, keyword-rich LinkedIn bios in first person. Optimise for recruiter search.",
        user: `Write a 2-sentence LinkedIn bio for ${name}, ${role} in ${industry}.
Include relevant industry keywords. Return only the bio.`,
      };
  }
}

async function callGemini(system: string, user: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    encodeURIComponent(key);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Gemini error", res.status, t);
    throw new Error(`Gemini API ${res.status}`);
  }
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
    "";
  if (!text.trim()) throw new Error("Empty response from Gemini");
  return text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return json(401, { error: "unauthorized" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes.user) return json(401, { error: "unauthorized" });
    const userId = userRes.user.id;

    const body = (await req.json()) as Body;
    if (!body?.type || !["summary", "bullets", "cover_letter", "linkedin_bio"].includes(body.type)) {
      return json(400, { error: "invalid_type" });
    }
    if (!body.profile || typeof body.profile !== "object") {
      return json(400, { error: "missing_profile" });
    }

    // Check Pro subscription (unlimited) or credits
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, price_id, current_period_end")
      .eq("user_id", userId)
      .eq("environment", "sandbox")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    const periodOk = !sub?.current_period_end || new Date(sub.current_period_end).getTime() > now;
    const isPro =
      !!sub &&
      periodOk &&
      ["active", "trialing", "past_due"].includes(sub.status) &&
      ["pro_monthly", "pro_yearly", "elite_monthly", "elite_yearly"].includes(sub.price_id);
    const isElite =
      isPro && (sub?.price_id === "elite_monthly" || sub?.price_id === "elite_yearly");

    let creditsBefore = 0;
    if (!isElite) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .maybeSingle();
      creditsBefore = prof?.credits ?? 0;
      // Pro: unlimited but still report credits. Free: must have credits.
      if (!isPro && creditsBefore <= 0) {
        return json(402, { error: "no_credits", creditsRemaining: 0 });
      }
    }

    const { system, user } = buildPrompt(body);
    const result = await callGemini(system, user);

    let creditsRemaining: number | null = null;
    if (!isElite && !isPro) {
      const next = Math.max(0, creditsBefore - 1);
      await supabase
        .from("profiles")
        .update({ credits: next, updated_at: new Date().toISOString() })
        .eq("id", userId);
      creditsRemaining = next;
    } else if (!isElite) {
      creditsRemaining = creditsBefore;
    }

    return json(200, { result, creditsRemaining, isPro, isElite });
  } catch (e) {
    console.error("ai-rewrite error", e);
    const msg = e instanceof Error ? e.message : "unknown_error";
    return json(500, { error: msg });
  }
});
