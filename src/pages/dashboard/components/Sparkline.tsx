/** A small trend line for a headline tile: one value per day, gaps skipped. Single series, brand coral. */
export function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const pts = values.map((v, i) => ({ i, v })).filter((p): p is { i: number; v: number } => p.v != null)
  if (pts.length < 2) return <div className="h-10" aria-hidden />
  const W = 100
  const H = 32
  const min = Math.min(...pts.map((p) => p.v))
  const max = Math.max(...pts.map((p) => p.v))
  const x = (i: number) => (values.length > 1 ? (i / (values.length - 1)) * W : 0)
  const y = (v: number) => (max === min ? H / 2 : H - 2 - ((v - min) / (max - min)) * (H - 4))
  const line = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(2)},${y(p.v).toFixed(2)}`).join(' ')
  const area = `${line} L${x(pts[pts.length - 1].i).toFixed(2)},${H} L${x(pts[0].i).toFixed(2)},${H} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-10 w-full overflow-visible" role="img" aria-label={`${label}, day by day`}>
      <path d={area} fill="var(--primary)" opacity={0.1} />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r={2.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
