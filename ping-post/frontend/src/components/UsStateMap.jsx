import { useState } from 'react'
import { US_STATE_GEO } from '../lib/usStatesGeo.js'

// Six-step blue ramp, same family as the app's primary colour, light to
// dark. Matches --heat-1..6 in the design draft this was built from.
const HEAT_STOPS = ['#eaf2fb', '#bcd8f1', '#7fb3e3', '#3f88cf', '#1f6fc0', '#144a82']

function heatColor(rate) {
  const idx = Math.min(HEAT_STOPS.length - 1, Math.floor(rate / (100 / HEAT_STOPS.length)))
  return HEAT_STOPS[idx]
}

/**
 * US states, shaded by a per-state metric, click-to-filter.
 *
 * `rates` is a Map (or plain object) of USPS abbreviation -> a 0-100
 * number; a state absent from it renders as "no data" and is not
 * clickable. `selected` / `onSelect(abbr | null)` make this a
 * controlled single-select, so the caller owns the filter state.
 */
export function UsStateMap({ rates, selected, onSelect }) {
  const [tooltip, setTooltip] = useState(null)
  const getRate = (abbr) => (rates instanceof Map ? rates.get(abbr) : rates?.[abbr])

  return (
    <div className="relative p-2">
      <svg viewBox={`0 0 ${US_STATE_GEO.width} ${US_STATE_GEO.height}`} className="block w-full">
        {US_STATE_GEO.parts.map((p) => {
          const rate = getRate(p.abbr)
          const known = rate != null
          return (
            <path
              key={p.abbr}
              d={p.d}
              stroke="#fff"
              strokeWidth={selected === p.abbr ? 1.6 : 0.7}
              fill={known ? heatColor(rate) : '#e9edf1'}
              className={known ? 'cursor-pointer transition-[filter] hover:brightness-110' : ''}
              onMouseMove={(e) => {
                const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                setTooltip({
                  abbr: p.abbr, rate,
                  x: e.clientX - rect.left, y: e.clientY - rect.top,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={known ? () => onSelect(selected === p.abbr ? null : p.abbr) : undefined}
            />
          )
        })}
        <path d={US_STATE_GEO.bordersPath} fill="none" stroke="#fff" strokeWidth={0.6} pointerEvents="none" />
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-text-primary px-2 py-1 text-[11px] font-medium text-white shadow-soft"
          style={{ left: tooltip.x, top: tooltip.y - 6 }}
        >
          <span className="font-bold">{tooltip.abbr}</span>
          {tooltip.rate == null ? ' · no leads yet' : ` · ${tooltip.rate.toFixed(0)}% accept rate`}
        </div>
      )}
    </div>
  )
}

export const MAP_HEAT_STOPS = HEAT_STOPS
