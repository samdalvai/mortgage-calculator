import { useMemo, useState } from 'react'

import { calculateMortgagePlan } from './lib/mortgage'

const euroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('it-IT', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type YearlyChartData = {
  year: number
  principal: number
  interest: number
}

function App() {
  const [houseCost, setHouseCost] = useState(250000)
  const [downPayment, setDownPayment] = useState(50000)
  const [years, setYears] = useState(25)
  const [annualInterestRate, setAnnualInterestRate] = useState(0.03)
  const [monthlyBankCost, setMonthlyBankCost] = useState(0)
  const [showPlan, setShowPlan] = useState(false)

  const plan = useMemo(
    () =>
      calculateMortgagePlan({
        houseCost,
        downPayment,
        years,
        annualInterestRate,
        monthlyBankCost,
      }),
    [annualInterestRate, downPayment, houseCost, monthlyBankCost, years],
  )

  const yearlyChartData = useMemo<YearlyChartData[]>(() => {
    const yearlyMap = new Map<number, YearlyChartData>()

    plan.installments.forEach((installment) => {
      const year = Math.ceil(installment.month / 12)
      const existing = yearlyMap.get(year)

      if (existing) {
        existing.principal += installment.principal
        existing.interest += installment.interest
        return
      }

      yearlyMap.set(year, {
        year,
        principal: installment.principal,
        interest: installment.interest,
      })
    })

    return Array.from(yearlyMap.values()).map((item) => ({
      ...item,
      principal: roundToCents(item.principal),
      interest: roundToCents(item.interest),
    }))
  }, [plan.installments])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mortgage Calculator (Alla Francese)</h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Simulate your mortgage plan in euro. The monthly payment includes bank monthly costs.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <form className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <InputField
              id="houseCost"
              label="House cost (€)"
              value={houseCost}
              min={0}
              step={1000}
              onValueChange={setHouseCost}
            />
            <InputField
              id="downPayment"
              label="Down payment (€)"
              value={downPayment}
              min={0}
              step={1000}
              onValueChange={setDownPayment}
            />
            <InputField
              id="years"
              label="Mortgage duration (years)"
              value={years}
              min={1}
              step={1}
              onValueChange={setYears}
            />
            <InputField
              id="annualInterestRate"
              label="Annual interest rate"
              value={annualInterestRate}
              min={0}
              max={1}
              step={0.001}
              onValueChange={setAnnualInterestRate}
              hint="Default is 0.03 (3%)"
            />
            <InputField
              id="monthlyBankCost"
              label="Monthly bank cost (€)"
              value={monthlyBankCost}
              min={0}
              step={1}
              onValueChange={setMonthlyBankCost}
            />
          </form>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Summary</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <SummaryItem label="Loan principal" value={euroFormatter.format(plan.principal)} />
                <SummaryItem label="Monthly payment" value={euroFormatter.format(plan.monthlyPayment)} />
                <SummaryItem
                  label="Monthly rate (without bank cost)"
                  value={euroFormatter.format(plan.monthlyRateWithoutBankCost)}
                />
                <SummaryItem label="Total interest" value={euroFormatter.format(plan.totalInterest)} />
                <SummaryItem label="Total bank costs" value={euroFormatter.format(plan.totalBankCosts)} />
                <SummaryItem label="Total paid" value={euroFormatter.format(plan.totalPaid)} />
              </dl>

              <button
                type="button"
                onClick={() => setShowPlan((current) => !current)}
                className="mt-5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
              >
                {showPlan ? 'Hide plan' : 'Show plan'}
              </button>

              {showPlan ? (
                <ul className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {plan.installments.map((installment) => (
                    <li
                      key={installment.month}
                      className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs sm:text-sm"
                    >
                      <p className="font-semibold text-emerald-300">Month {installment.month}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <PlanValue label="Payment" value={euroFormatter.format(installment.payment)} />
                        <PlanValue label="Principal" value={euroFormatter.format(installment.principal)} />
                        <PlanValue label="Interest" value={euroFormatter.format(installment.interest)} />
                        <PlanValue label="Bank cost" value={euroFormatter.format(installment.bankCost)} />
                        <PlanValue
                          label="Remaining capital"
                          value={euroFormatter.format(installment.remainingPrincipal)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Mortgage chart</h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Yearly breakdown of principal paid and interest paid over time.
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <SummaryItem label="House cost" value={euroFormatter.format(houseCost)} />
                <SummaryItem label="Down payment" value={euroFormatter.format(downPayment)} />
                <SummaryItem label="Mortgage duration" value={`${years} years`} />
                <SummaryItem label="Annual interest rate" value={percentFormatter.format(annualInterestRate)} />
                <SummaryItem label="Monthly bank cost" value={euroFormatter.format(monthlyBankCost)} />
                <SummaryItem label="Financed amount" value={euroFormatter.format(plan.principal)} />
              </dl>

              <MortgageBreakdownChart data={yearlyChartData} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

type InputFieldProps = {
  id: string
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  hint?: string
  onValueChange: (value: number) => void
}

function InputField({ id, label, value, min, max, step, hint, onValueChange }: InputFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        id={id}
        type="number"
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-400 focus:ring"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onValueChange(Number(event.target.value))}
      />
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950/60 p-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-100">{value}</dd>
    </div>
  )
}

function PlanValue({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-slate-400">{label}: </span>
      <span className="font-medium text-slate-100">{value}</span>
    </p>
  )
}

function MortgageBreakdownChart({ data }: { data: YearlyChartData[] }) {
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
                <span className="text-slate-300">
                  {euroFormatter.format(item.principal + item.interest)} total
                </span>
              </div>

              <div className="h-5 overflow-hidden rounded bg-slate-800">
                <div className="flex h-full w-full">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${principalPercent}%` }}
                    title={`Principal: ${euroFormatter.format(item.principal)}`}
                  />
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${interestPercent}%` }}
                    title={`Interest: ${euroFormatter.format(item.interest)}`}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-300 sm:grid-cols-2">
                <span>Principal: {euroFormatter.format(item.principal)}</span>
                <span>Interest: {euroFormatter.format(item.interest)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const roundToCents = (value: number): number => Math.round(value * 100) / 100

export default App
