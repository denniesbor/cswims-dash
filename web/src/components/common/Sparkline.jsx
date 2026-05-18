/*
 * Role: A compact inline trend line.
 * Author: Dennies Bor
 * Description:
 *   Draws a small SVG line from a series of numeric values, with no axes or
 *   labels. Used inside the space weather tiles to show recent trend behind a
 *   current value. Non-finite values are skipped.
 */

export default function Sparkline({ values, width = 120, height = 32, color = "#58a6ff" }) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  const points = clean.map((v, i) => {
    const x = (i / (clean.length - 1)) * width;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={width} height={height} className="block">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}