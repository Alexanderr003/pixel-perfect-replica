/**
 * Diagonal repeating watermark overlay for Free users.
 * Cosmetic deterrent — browsers cannot block screenshots.
 * Pointer-events disabled so it does not interfere with the underlying preview.
 */
interface Props {
  /** When false, renders nothing (Pro users). */
  show: boolean;
  /** Tweak text size; small for thumbnails, larger for full preview. */
  size?: "sm" | "md" | "lg";
  label?: string;
}

const SIZE_MAP = {
  sm: { font: 10, gap: 70 },
  md: { font: 18, gap: 130 },
  lg: { font: 26, gap: 180 },
} as const;

export function PreviewWatermark({ show, size = "md", label = "PROFILUM · PREVIEW" }: Props) {
  if (!show) return null;
  const { font, gap } = SIZE_MAP[size];
  // Inline SVG used as repeating background — survives at any zoom and is
  // captured in screenshots since it lives inside the same DOM tree.
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${gap * 2}' height='${gap * 2}'>` +
      `<text x='0' y='${gap}' fill='rgba(0,0,0,0.18)' font-family='Inter,Arial,sans-serif' ` +
      `font-size='${font}' font-weight='600' transform='rotate(-30 ${gap} ${gap})'>${label}</text>` +
      `<text x='${gap}' y='${gap * 2}' fill='rgba(0,0,0,0.18)' font-family='Inter,Arial,sans-serif' ` +
      `font-size='${font}' font-weight='600' transform='rotate(-30 ${gap * 2} ${gap * 2})'>${label}</text>` +
    `</svg>`
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundRepeat: "repeat",
        mixBlendMode: "multiply",
      }}
    />
  );
}