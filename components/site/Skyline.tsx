/**
 * Decorative city skyline for the hero, drawn in code (no stock photo).
 * Swap for a licensed Addis Ababa photograph when Meleph supplies one (plan §6.4).
 */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildings(seed: number, count: number, minH: number, maxH: number) {
  const r = rand(seed);
  const out: { x: number; w: number; h: number; windows: { x: number; y: number }[] }[] = [];
  let x = -20;
  for (let i = 0; i < count && x < 1440; i++) {
    const w = 40 + Math.round(r() * 70);
    const h = minH + Math.round(r() * (maxH - minH));
    const windows: { x: number; y: number }[] = [];
    for (let wy = 600 - h + 14; wy < 590; wy += 16) {
      for (let wx = x + 8; wx < x + w - 8; wx += 12) if (r() > 0.78) windows.push({ x: wx, y: wy });
    }
    out.push({ x, w, h, windows });
    x += w + 2 + Math.round(r() * 10);
  }
  return out;
}

const back = buildings(7, 40, 140, 360);
const front = buildings(19, 40, 60, 220);

export function Skyline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e3a5f" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="sky-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16253d" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
      </defs>
      <g opacity="0.55">
        {back.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={600 - b.h} width={b.w} height={b.h} fill="url(#sky-back)" />
            {b.windows.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width="4" height="6" fill="#4fa3e0" opacity="0.35" />
            ))}
          </g>
        ))}
      </g>
      <g>
        {front.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={600 - b.h} width={b.w} height={b.h} fill="url(#sky-front)" />
            {b.windows.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width="4" height="6" fill={j % 5 === 0 ? "#34c38a" : "#cbd5e1"} opacity="0.18" />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
