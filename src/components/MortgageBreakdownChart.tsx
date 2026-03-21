type YearlyChartData = {
  year: number
  principal: number
  interest: number
}

type MortgageBreakdownChartProps = {
  data: YearlyChartData[]
  formatCurrency: (value: number) => string
}

export function MortgageBreakdownChart({ data, formatCurrency }: MortgageBreakdownChartProps) {
  if (data.length === 0) {
    return <p className="mt-4 text-sm text-slate-400">No chart data available yet.</p>
  }

  const maxCombinedValue = Math.max(...data.map((item) => item.principal + item.interest), 1)

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-emerald-400" aria-hidden />
          Principal paid
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-cyan-400" aria-hidden />
          Interest paid
        </span>
      </div>

      <ul className="space-y-2">
        {data.map((item) => {
          const principalPercent = (item.principal / maxCombinedValue) * 100
          const interestPercent = (item.interest / maxCombinedValue) * 100

          return (
            <li key={item.year} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-200">Year {item.year}</span>
                <span className="text-slate-300">{formatCurrency(item.principal + item.interest)} total</span>
              </div>

              <div className="h-5 overflow-hidden rounded bg-slate-800">
                <div className="flex h-full w-full">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${principalPercent}%` }}
                    title={`Principal: ${formatCurrency(item.principal)}`}
                  />
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${interestPercent}%` }}
                    title={`Interest: ${formatCurrency(item.interest)}`}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-300 sm:grid-cols-2">
                <span>Principal: {formatCurrency(item.principal)}</span>
                <span>Interest: {formatCurrency(item.interest)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export type { YearlyChartData }
