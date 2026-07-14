import { useMemo, useState } from "react"
import type { PointerEvent } from "react"

export type TrendPoint = { t: number; v: number; detail?: string }

const W = 320
const H = 110
const PAD_X = 6
const PAD_Y = 10

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

/** Single-series time trend: token colors only, recessive grid, data-hugging
 * y-domain, touch readout instead of a floating tooltip (mobile-first).
 * Dense series stay a clean line — set showPoints only for sparse data. */
export function TrendChart({
  line,
  dots,
  formatValue,
  ariaLabel,
  showPoints = false,
}: {
  line: TrendPoint[]
  dots?: TrendPoint[]
  formatValue: (v: number) => string
  ariaLabel: string
  showPoints?: boolean
}) {
  const [active, setActive] = useState<TrendPoint | null>(null)
  const markers = dots ?? line

  const { x, y, path, yTicks } = useMemo(() => {
    const all = [...line, ...(dots ?? [])]
    const tMin = Math.min(...all.map((p) => p.t))
    const tMax = Math.max(...all.map((p) => p.t))
    const span = Math.max(...all.map((p) => p.v)) - Math.min(...all.map((p) => p.v))
    const pad = Math.max(span * 0.15, 0.4)
    const vMin = Math.min(...all.map((p) => p.v)) - pad
    const vMax = Math.max(...all.map((p) => p.v)) + pad
    const x = (t: number) =>
      tMax === tMin ? W / 2 : PAD_X + ((t - tMin) / (tMax - tMin)) * (W - 2 * PAD_X)
    const y = (v: number) => PAD_Y + (1 - (v - vMin) / (vMax - vMin)) * (H - 2 * PAD_Y)
    const path = line
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`)
      .join(" ")
    const yTicks = [vMin + pad, (vMin + vMax) / 2, vMax - pad].map((v) => ({
      v: Math.round(v * 10) / 10,
      py: y(v),
    }))
    return { x, y, path, yTicks }
  }, [line, dots])

  function onPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * W
    let nearest: TrendPoint | null = null
    let best = Infinity
    for (const p of markers) {
      const d = Math.abs(x(p.t) - px)
      if (d < best) {
        best = d
        nearest = p
      }
    }
    setActive(nearest)
  }

  if (line.length === 0 && markers.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      <p className="h-4 text-xs text-muted-foreground">
        {active
          ? `${dateFormat.format(new Date(active.t))} · ${formatValue(active.v)}${active.detail ? ` (${active.detail})` : ""}`
          : " "}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-28 w-full touch-none select-none"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setActive(null)}
      >
        {yTicks.map((tick) => (
          <g key={tick.py}>
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
        {dots?.map((p) => (
          <circle
            key={p.t}
            cx={x(p.t)}
            cy={y(p.v)}
            r={active?.t === p.t ? 4 : 2.5}
            className={active?.t === p.t ? "fill-chart-1" : "fill-muted-foreground/40"}
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
        {!dots &&
          showPoints &&
          line.map((p) => (
            <circle
              key={p.t}
              cx={x(p.t)}
              cy={y(p.v)}
              r={active?.t === p.t ? 4 : 2.5}
              className="fill-chart-1"
            />
          ))}
        {!dots && !showPoints && active && (
          <circle cx={x(active.t)} cy={y(active.v)} r={4} className="fill-chart-1" />
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{dateFormat.format(new Date(markers[0]?.t ?? Date.now()))}</span>
        <span>{dateFormat.format(new Date(markers.at(-1)?.t ?? Date.now()))}</span>
      </div>
    </div>
  )
}
