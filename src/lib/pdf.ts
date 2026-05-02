import type { CvPreviewData } from "@/components/cv/CvPreview";

/**
 * Render a CV to an off-screen container and export as PDF using html2pdf.
 * We render at scale=1 (A4) into a hidden node, then convert.
 */
export async function downloadCvPdf(
  data: CvPreviewData,
  filename = "cv.pdf",
  options: { watermark?: boolean } = {}
) {
  const { createRoot } = await import("react-dom/client");
  const React = await import("react");
  const { CvPreview } = await import("@/components/cv/CvPreview");
  const html2pdf = ((await import("html2pdf.js")) as any).default;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "210mm";
  host.style.background = "#ffffff";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(React.createElement(CvPreview, { data, scale: 1 }));

  // Wait a tick for layout/fonts
  await new Promise((r) => setTimeout(r, 250));
  if (document.fonts && (document.fonts as any).ready) {
    try { await (document.fonts as any).ready; } catch { /* ignore */ }
  }

  const target = host.firstElementChild as HTMLElement | null;
  const node = target ?? host;

  // Inject watermark overlay for Free users
  let watermarkEl: HTMLDivElement | null = null;
  if (options.watermark) {
    watermarkEl = document.createElement("div");
    watermarkEl.style.cssText = [
      "position:absolute",
      "inset:0",
      "pointer-events:none",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "z-index:9999",
    ].join(";");
    watermarkEl.innerHTML = `
      <div style="transform:rotate(-30deg);font-family:Georgia,serif;font-size:84px;color:rgba(163,130,58,0.18);letter-spacing:0.15em;font-weight:300;white-space:nowrap;">
        PROFILUM · FREE
      </div>`;
    if (node instanceof HTMLElement) {
      const prev = node.style.position;
      node.style.position = prev || "relative";
      node.appendChild(watermarkEl);
    }
  }

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any)
      .from(node)
      .save();
  } finally {
    if (watermarkEl) watermarkEl.remove();
    root.unmount();
    host.remove();
  }
}