import { useRef, useState } from "react";
import { Sparkles, Upload, FileText, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedCv {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  experience?: { jobTitle?: string; company?: string; startDate?: string; endDate?: string; location?: string; description?: string }[];
  education?: { degree?: string; institution?: string; year?: string; grade?: string }[];
  skills?: string[];
  languages?: { language?: string; level?: string }[];
}

interface Props {
  onExtracted: (data: ExtractedCv) => void;
  onSkip: () => void;
}

const STAGES = [
  "Reading file contents…",
  "Sending to AI…",
  "Structuring data…",
  "Filling your form…",
];

const MAX_BYTES = 5 * 1024 * 1024;

export function CvImportBlock({ onExtracted, onSkip }: Props) {
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [text, setText] = useState("");
  const [stageIdx, setStageIdx] = useState<number | null>(null);
  const [success, setSuccess] = useState<ExtractedCv | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const animateStages = async () => {
    for (let i = 0; i < STAGES.length; i++) {
      setStageIdx(i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const submit = async (file?: File) => {
    setStageIdx(0);
    setSuccess(null);
    const stagePromise = animateStages();
    try {
      let resData: ExtractedCv | null = null;
      if (file) {
        if (file.size > MAX_BYTES) {
          toast.error("File too large. Max 5MB.");
          setStageIdx(null);
          return;
        }
        const ok = /\.(pdf|docx|txt)$/i.test(file.name);
        if (!ok) {
          toast.error("Unsupported format. Use PDF, DOCX or TXT.");
          setStageIdx(null);
          return;
        }
        const form = new FormData();
        form.append("file", file);
        const { data, error } = await supabase.functions.invoke("extract-cv", { body: form });
        if (error) throw error;
        resData = (data as { data?: ExtractedCv }).data ?? null;
      } else {
        if (!text.trim()) {
          toast.error("Paste some text first.");
          setStageIdx(null);
          return;
        }
        const { data, error } = await supabase.functions.invoke("extract-cv", {
          body: { text },
        });
        if (error) throw error;
        resData = (data as { data?: ExtractedCv }).data ?? null;
      }
      await stagePromise;
      if (!resData) throw new Error("No data");
      setSuccess(resData);
      onExtracted(resData);
      toast.success("Form auto-filled.");
    } catch (e) {
      console.error(e);
      toast.error("Could not parse the CV. Try another file or paste the text.");
      setStageIdx(null);
    }
  };

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    submit(f);
  };

  if (success) {
    return (
      <div className="rounded-lg border border-gold/30 bg-surface p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Check className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-serif text-lg text-foreground">Form auto-filled</p>
            <p className="mt-1 text-sm text-dim">
              {(success.experience?.length ?? 0)} positions · {(success.education?.length ?? 0)} degrees · {(success.skills?.length ?? 0)} skills
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="goldOutline"
                size="sm"
                onClick={() => {
                  setSuccess(null);
                  setStageIdx(null);
                  setText("");
                }}
              >
                Upload a different file
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stageIdx !== null) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gold" />
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Processing</p>
            <p className="text-sm text-foreground">{STAGES[stageIdx]}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-1">
          {STAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= stageIdx ? "bg-gold" : "bg-border-subtle"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/30 bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <p className="font-serif text-lg text-foreground">Import your existing CV</p>
        </div>
        <span className="rounded-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
          Recommended
        </span>
      </div>
      <p className="px-6 pt-4 text-sm text-dim">
        AI reads your file and fills the form instantly.
      </p>

      <div className="mt-4 flex border-b border-subtle px-6">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`-mb-px border-b-2 px-3 py-2 text-xs uppercase tracking-widest ${
            tab === "upload" ? "border-gold text-gold" : "border-transparent text-dim hover:text-foreground"
          }`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setTab("paste")}
          className={`-mb-px border-b-2 px-3 py-2 text-xs uppercase tracking-widest ${
            tab === "paste" ? "border-gold text-gold" : "border-transparent text-dim hover:text-foreground"
          }`}
        >
          Paste text
        </button>
      </div>

      {tab === "upload" ? (
        <div className="p-6">
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-6 py-10 text-center transition-colors ${
              drag ? "border-gold bg-gold/5" : "border-subtle hover:border-gold/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Upload className="h-6 w-6 text-gold" />
            <p className="mt-3 text-sm text-foreground">Drop your CV here, or click to browse</p>
            <p className="mt-1 text-xs text-dim">Supports PDF, Word (.docx) and plain text · Max 5MB</p>
            <div className="mt-4 flex gap-2 text-[10px] uppercase tracking-widest text-dim">
              <span className="rounded-sm border border-subtle px-2 py-0.5">PDF</span>
              <span className="rounded-sm border border-subtle px-2 py-0.5">DOCX</span>
              <span className="rounded-sm border border-subtle px-2 py-0.5">TXT</span>
            </div>
          </label>
        </div>
      ) : (
        <div className="p-6">
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full text of your CV here…"
            className="resize-none"
          />
          <div className="mt-4 flex justify-end">
            <Button variant="gold" size="sm" onClick={() => submit()}>
              <FileText className="mr-2 h-4 w-4" />
              Parse with AI
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-subtle px-6 py-3 text-right">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-dim transition-colors hover:text-foreground"
        >
          Skip — I'll fill it in manually <X className="ml-1 inline h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
