interface SparklineProps {
  dailyTotals: number[];
}

export function Sparkline({ dailyTotals }: SparklineProps): JSX.Element {
  const width = 140;
  const height = 36;
  const max = Math.max(1, ...dailyTotals);
  const step = width / Math.max(1, dailyTotals.length - 1);

  const points = dailyTotals
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Debits over the last 7 days"
      className="text-teal"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
