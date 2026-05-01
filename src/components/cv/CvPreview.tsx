import { Mail, Phone, MapPin, Globe } from "lucide-react";

export type CvPreviewData = {
  basics: { fullName: string; headline: string; email: string; phone: string; location: string; website: string };
  summary: string;
  experience: { id: string; role: string; company: string; period: string; description: string }[];
  education: { id: string; degree: string; school: string; period: string }[];
  skills: string[];
  templateId: string;
};

type Props = {
  data: CvPreviewData;
  scale?: number;
};

/**
 * Renders a CV preview at A4 proportions. The container is the printable page;
 * `scale` lets callers fit it into a thumbnail or live preview pane.
 */
export const CvPreview = ({ data, scale = 1 }: Props) => {
  const tpl = data.templateId;
  const isObsidian = tpl === "obsidian" || tpl === "noir";
  const isAurum = tpl === "aurum";

  // Theme classes per template (kept self-contained; preview is always rendered
  // with light background unless template is dark, regardless of app theme).
  const pageClass = isObsidian
    ? "bg-[#0E0D0B] text-[#F2EBD9]"
    : isAurum
    ? "bg-[#FBF6E9] text-[#1B1610]"
    : "bg-white text-[#15110C]";
  const accentColor = isObsidian ? "#D4B564" : isAurum ? "#A47C2C" : "#A3823A";
  const dividerColor = isObsidian ? "rgba(212,181,100,0.35)" : "rgba(0,0,0,0.12)";
  const subtleText = isObsidian ? "rgba(242,235,217,0.65)" : "rgba(21,17,12,0.6)";

  return (
    <div
      className="origin-top-left shadow-2xl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className={`relative h-full w-full p-12 ${pageClass}`} style={{ minHeight: "297mm", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Header */}
        <header className="border-b pb-6" style={{ borderColor: dividerColor }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 44,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: accentColor,
            }}
          >
            {data.basics.fullName || "Your Name"}
          </h1>
          {data.basics.headline && (
            <p className="mt-2 text-base tracking-wide uppercase" style={{ color: subtleText, letterSpacing: "0.18em", fontSize: 11 }}>
              {data.basics.headline}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs" style={{ color: subtleText }}>
            {data.basics.email && (
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" />{data.basics.email}</span>
            )}
            {data.basics.phone && (
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{data.basics.phone}</span>
            )}
            {data.basics.location && (
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{data.basics.location}</span>
            )}
            {data.basics.website && (
              <span className="inline-flex items-center gap-1.5"><Globe className="h-3 w-3" />{data.basics.website}</span>
            )}
          </div>
        </header>

        {/* Summary */}
        {data.summary && (
          <section className="mt-7">
            <SectionTitle accent={accentColor}>Profile</SectionTitle>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: subtleText }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mt-7">
            <SectionTitle accent={accentColor}>Experience</SectionTitle>
            <div className="mt-4 space-y-5">
              {data.experience.map((e) => (
                <div key={e.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[14px] font-medium">
                      {e.role || "Role"}
                      {e.company && <span style={{ color: subtleText }}> · {e.company}</span>}
                    </h3>
                    {e.period && (
                      <span className="text-[11px] tabular-nums" style={{ color: subtleText }}>{e.period}</span>
                    )}
                  </div>
                  {e.description && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: subtleText }}>
                      {e.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section className="mt-7">
            <SectionTitle accent={accentColor}>Education</SectionTitle>
            <div className="mt-4 space-y-3">
              {data.education.map((ed) => (
                <div key={ed.id} className="flex items-baseline justify-between gap-4">
                  <p className="text-[13px]">
                    <span className="font-medium">{ed.degree || "Degree"}</span>
                    {ed.school && <span style={{ color: subtleText }}> · {ed.school}</span>}
                  </p>
                  {ed.period && <span className="text-[11px] tabular-nums" style={{ color: subtleText }}>{ed.period}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section className="mt-7">
            <SectionTitle accent={accentColor}>Skills</SectionTitle>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-sm px-2 py-1 text-[11px]"
                  style={{
                    border: `1px solid ${dividerColor}`,
                    color: subtleText,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({ children, accent }: { children: React.ReactNode; accent: string }) => (
  <h2
    className="text-[10px] uppercase"
    style={{
      letterSpacing: "0.28em",
      color: accent,
      fontWeight: 600,
    }}
  >
    {children}
  </h2>
);