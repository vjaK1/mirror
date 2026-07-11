import { useMemo, useState } from "react"
import type { PointerEvent } from "react"

export type WeightPoint = { t: number; kg: number }

const W = 320
const H = 110
const PAD_X = 6
const PAD_Y = 10

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

/** Weight trend: 7-day trailing average as the line (the headline series,
 * CLAUDE.md rule 11), raw daily weigh-ins as muted dots. Single series —
 * no legend; colors come from chart tokens only. */
export function WeightChart({
  raw,
  avg,
}: {
  raw: WeightPoint[]
  avg: WeightPoint[]
}) {
  const [active, setActive] = useState<WeightPoint | null>(null)

  const { x, y, path, yTicks } = useMemo(() => {
    const all = [...raw, ...avg]
    const tMin = Math.min(...all.map((p) => p.t))
    const tMax = Math.max(...all.map((p) => p.t))
    const kgMin = Math.min(...all.map((p) => p.kg)) - 0.4
    const kgMax = Math.max(...all.map((p) => p.kg)) + 0.4
    const x = (t: number) =>
      tMax === tMin
        ? W / 2
        : PAD_X + ((t - tMin) / (tMax - tMin)) * (W - 2 * PAD_X)
    const y = (kg: number) =>
      PAD_Y + (1 - (kg - kgMin) / (kgMax - kgMin)) * (H - 2 * PAD_Y)
    const path = avg
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p.kg).toFixed(1)}`)
      .join(" ")
    const mid = (kgMin + kgMax) / 2
    const yTicks = [kgMin + 0.4, mid, kgMax - 0.4].map((v) => ({
      v: Math.round(v * 10) / 10,
      py: y(v),
    }))
    return { x, y, path, yTicks }
  }, [raw, avg])

  function onPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * W
    let nearest: WeightPoint | null = null
    let best = Infinity
    for (const p of raw) {
      const d = Math.abs(x(p.t) - px)
      if (d < best) {
        best = d
        nearest = p
      }
    }
    setActive(nearest)
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="h-4 text-xs text-muted-foreground">
        {active
          ? `${dateFormat.format(new Date(active.t))} · ${active.kg.toFixed(1)} kg`
          : " "}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-28 w-full touch-none select-none"
        role="img"
        aria-label="Weight trend: 7-day average line with daily weigh-in dots"
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setActive(null)}
      >
        {yTicks.map((tick) => (
          <g key={tick.v}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={tick.py}
              y2={tick.py}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={W - PAD_X}
              y={tick.py - 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {tick.v}
            </text>
          </g>
        ))}
        {raw.map((p) => (
          <circle
            key={p.t}
            cx={x(p.t)}
            cy={y(p.kg)}
            r={active?.t === p.t ? 4 : 2.5}
            className={
              active?.t === p.t ? "fill-chart-1" : "fill-muted-foreground/40"
            }
          />
        ))}
        <path
          d={path}
          className="stroke-chart-1"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{dateFormat.format(new Date(raw[0]?.t ?? Date.now()))}</span>
        <span>{dateFormat.format(new Date(raw.at(-1)?.t ?? Date.now()))}</span>
      </div>
    </div>
  )
}
