import mammoth from "npm:mammoth@1.8.0";
import { getDocument, GlobalWorkerOptions } from "npm:pdfjs-dist@4.7.76/legacy/build/pdf.mjs";

// pdfjs in Deno: disable worker
// @ts-ignore
GlobalWorkerOptions.workerSrc = "";

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

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

async function extractTextFromFile(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  const ab = await file.arrayBuffer();
  if (ab.byteLength > MAX_BYTES) throw new Error("file_too_large");

  if (name.endsWith(".txt") || file.type === "text/plain") {
    return new TextDecoder().decode(ab);
  }
  if (name.endsWith(".docx") || file.type.includes("word")) {
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    return result.value ?? "";
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const data = new Uint8Array(ab);
    // @ts-ignore
    const pdf = await getDocument({ data, disableFontFace: true, useSystemFonts: false }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((it: { str?: string }) => it.str ?? "");
      out += strings.join(" ") + "\n";
    }
    return out;
  }
  throw new Error("unsupported_format");
}

async function callGeminiJson(system: string, user: string): Promise<string> {
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
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Gemini extract error", res.status, t);
    throw new Error(`Gemini API ${res.status}`);
  }
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
    "";
  return text.trim();
}

const SYSTEM_PROMPT = `You are a CV parser. Extract all professional information from the provided text.
Return ONLY a valid JSON object. No explanation, no markdown, no code blocks.
Use empty strings for missing fields, empty arrays for missing lists.`;

function userPrompt(text: string) {
  return `Extract and return this exact JSON structure from the CV text:

{
  "firstName": "",
  "lastName": "",
  "title": "",
  "email": "",
  "phone": "",
  "city": "",
  "country": "",
  "linkedin": "",
  "website": "",
  "summary": "",
  "experience": [{ "jobTitle": "", "company": "", "startDate": "", "endDate": "", "location": "", "description": "" }],
  "education": [{ "degree": "", "institution": "", "year": "", "grade": "" }],
  "skills": [],
  "languages": [{ "language": "", "level": "" }]
}

CV TEXT:
${text.slice(0, 30000)}`;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract first {...} block
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        // fallthrough
      }
    }
    throw new Error("invalid_json_from_model");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    let text = "";
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return json(400, { error: "missing_file" });
      text = await extractTextFromFile(file);
    } else {
      const body = await req.json().catch(() => null);
      const t = (body as { text?: string } | null)?.text;
      if (!t || typeof t !== "string") return json(400, { error: "missing_text" });
      if (t.length > MAX_BYTES) return json(400, { error: "text_too_large" });
      text = t;
    }

    if (!text.trim()) return json(400, { error: "empty_document" });

    const raw = await callGeminiJson(SYSTEM_PROMPT, userPrompt(text));
    const parsed = safeParse(raw);
    return json(200, { data: parsed });
  } catch (e) {
    console.error("extract-cv error", e);
    const msg = e instanceof Error ? e.message : "unknown_error";
    const status = msg === "file_too_large" ? 413 : msg === "unsupported_format" ? 415 : 500;
    return json(status, { error: msg });
  }
});
