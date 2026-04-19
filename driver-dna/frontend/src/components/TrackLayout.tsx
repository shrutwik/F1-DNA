export function TrackLayout() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
      <svg
        viewBox="0 0 320 170"
        className="h-36 w-full"
        role="img"
        aria-label="Stylized track layout"
      >
        <path
          d="M40 95 C45 40, 120 20, 170 45 C210 63, 250 60, 275 90 C294 113, 280 140, 245 142 C205 145, 185 122, 154 121 C125 120, 112 139, 80 136 C52 132, 35 118, 40 95 Z"
          stroke="#ffffff"
          strokeWidth={5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="42" cy="95" r="4" fill="#ffffff" />
      </svg>
    </div>
  );
}
