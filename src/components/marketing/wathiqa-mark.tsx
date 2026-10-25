/**
 * The Wathiqa document mark: an emerald sheet with a folded corner and the
 * gold validation check. Drawn from the brand SVG — no raster asset, no
 * external icon font. `tone` selects the sheet colour: the deep sheet of the
 * white header, or the bright sheet used on the dark footer band.
 */
export function WathiqaMark({
  className = "h-10 w-10",
  tone = "deep",
}: {
  className?: string;
  tone?: "deep" | "bright";
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 6C8 4.89543 8.89543 4 10 4H26L32 10V34C32 35.1046 31.1046 36 30 36H10C8.89543 36 8 35.1046 8 34V6Z"
        fill={tone === "bright" ? "#10b981" : "#064e3b"}
      />
      <path d="M26 4L32 10H28C26.8954 10 26 9.10457 26 8V4Z" fill="#047857" />
      <path
        d="M15 22L19 26L27 17"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
