import { useMemo } from 'react'

import { EURO_NUMBER_LOCALE } from '../lib/formatting'

export type ChartPoint = {
  year: number
  remainingCapital: number
  reimbursedCapital: number
  paidInterest: number
}

type InteractiveChartProps = {
  data: ChartPoint[]
  maxAmount: number
  selectedYear: number
  onYearChange: (year: number) => void
}

export function InteractiveChart({ data, maxAmount, selectedYear, onYearChange }: InteractiveChartProps) {
  const width = 1200
  const height = 650
  const padding = { top: 20, right: 24, bottom: 40, left: 112 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0
  const maxYear = data[data.length - 1]?.year ?? 0
  const yTicks = 4
  const xTickStep = useMemo(() => {
    if (maxYear <= 6) {
      return 1
    }

    const rawStep = maxYear / 6
    const possibleSteps = [1, 2, 5, 10, 15, 20, 25, 30]
    return possibleSteps.find((step) => step >= rawStep) ?? possibleSteps[possibleSteps.length - 1]
  }, [maxYear])
  const xTicks = useMemo(() => {
    const ticks = [0]

    for (let year = xTickStep; year <= maxYear; year += xTickStep) {
      ticks.push(year)
    }

    if (ticks[ticks.length - 1] !== maxYear) {
      ticks.push(maxYear)
    }

    return ticks
  }, [maxYear, xTickStep])
  const yAxisFormatter = useMemo(
    () =>
      new Intl.NumberFormat(EURO_NUMBER_LOCALE, {
        maximumFractionDigits: 1,
      }),
    [],
  )

  const xForIndex = (index: number) => padding.left + index * xStep
  const xForYear = (year: number) =>
    maxYear === 0 ? padding.left : padding.left + (year / maxYear) * innerWidth
  const yForValue = (value: number) => {
    if (maxAmount <= 0) {
      return padding.top + innerHeight
    }

    return padding.top + innerHeight - (value / maxAmount) * innerHeight
  }

  const linePath = (extractor: (point: ChartPoint) => number) =>
    data
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForValue(extractor(point))}`)
      .join(' ')

  return (
    <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/80 p-2 sm:p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[250px] w-full"
        role="img"
        aria-label="Mortgage capital and interest chart"
      >
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          className="stroke-slate-600"
        />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} className="stroke-slate-600" />

        <path d={linePath((point) => point.remainingCapital)} fill="none" className="stroke-violet-400" strokeWidth={2.5} />
        <path d={linePath((point) => point.reimbursedCapital)} fill="none" className="stroke-emerald-400" strokeWidth={2.5} />
        <path d={linePath((point) => point.paidInterest)} fill="none" className="stroke-cyan-400" strokeWidth={2.5} />

        {Array.from({ length: yTicks + 1 }, (_, index) => {
          const tickValue = (maxAmount / yTicks) * index
          const y = yForValue(tickValue)

          return (
            <g key={`y-tick-${index}`}>
              <line x1={padding.left - 6} y1={y} x2={padding.left} y2={y} className="stroke-slate-500" />
              <text x={padding.left - 12} y={y + 6} className="fill-slate-400 text-[20px]" textAnchor="end">
                {`${yAxisFormatter.format(tickValue / 1000)} K`}
              </text>
            </g>
          )
        })}

        {xTicks.map((tickYear) => (
          <text
            key={`x-tick-${tickYear}`}
            x={xForYear(tickYear)}
            y={padding.top + innerHeight + 34}
            className="fill-slate-400 text-[20px]"
            textAnchor="middle"
          >
            {tickYear}
          </text>
        ))}

        {selectedYear >= 0 && selectedYear < data.length ? (
          <>
            <line
              x1={xForIndex(selectedYear)}
              y1={padding.top}
              x2={xForIndex(selectedYear)}
              y2={padding.top + innerHeight}
              className="stroke-slate-300"
              strokeDasharray="4 4"
            />
            <circle cx={xForIndex(selectedYear)} cy={yForValue(data[selectedYear].remainingCapital)} r={4} className="fill-violet-300" />
            <circle cx={xForIndex(selectedYear)} cy={yForValue(data[selectedYear].reimbursedCapital)} r={4} className="fill-emerald-300" />
            <circle cx={xForIndex(selectedYear)} cy={yForValue(data[selectedYear].paidInterest)} r={4} className="fill-cyan-300" />
          </>
        ) : null}
      </svg>
      <div className="mt-3 px-1">
        <input
          type="range"
          min={0}
          max={Math.max(data.length - 1, 0)}
          step={1}
          value={Math.min(Math.max(selectedYear, 0), Math.max(data.length - 1, 0))}
          onChange={(event) => onYearChange(Number(event.target.value))}
          aria-label="Select chart year"
          className="h-2 w-full cursor-pointer accent-emerald-400"
        />
      </div>
    </div>
  )
}
