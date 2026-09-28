/**
 * Jauge semi-circulaire 0–100 %, en SVG pur (rendu serveur, aucun JS client).
 */
export function ScoreGauge({ value, size = 180 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // demi-cercle
  const offset = circumference * (1 - clamped / 100);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size / 2 + stroke / 2 + 4 }}>
      <svg
        width={size}
        height={size / 2 + stroke / 2 + 4}
        viewBox={`0 0 ${size} ${size / 2 + stroke / 2 + 4}`}
        role="img"
        aria-label={`Score de Dominance GEO : ${clamped} %`}
      >
        <defs>
          <linearGradient id="gauge-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path d={arc} fill="none" stroke="#22262F" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-4xl font-semibold tracking-tight tabular">
          {clamped.toLocaleString("fr-FR")}
          <span className="text-xl text-muted-foreground">%</span>
        </span>
      </div>
    </div>
  );
}
