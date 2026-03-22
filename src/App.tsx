import { useEffect, useMemo, useState } from 'react'

import { ChartLegendValue, PlanValue, SummaryItem } from './components/DisplayValue'
import { InputField } from './components/InputField'
import { InteractiveChart, type ChartPoint } from './components/InteractiveChart'
import { TRANSLATIONS, getBrowserLanguage, type SupportedLanguage } from './i18n/translations'
import { EURO_NUMBER_LOCALE, formatDurationLabel } from './lib/formatting'
import { calculateMortgagePlan, type AdditionalPaymentStrategy } from './lib/mortgage'
import { downloadMortgagePlanPdf } from './lib/pdf'

function App() {
  const [language, setLanguage] = useState<SupportedLanguage>(getBrowserLanguage)
  const [houseCost, setHouseCost] = useState(250000)
  const [downPayment, setDownPayment] = useState(50000)
  const [years, setYears] = useState(25)
  const [annualInterestRate, setAnnualInterestRate] = useState(3)
  const [monthlyBankCost, setMonthlyBankCost] = useState(0)
  const [additionalAnnualPayment, setAdditionalAnnualPayment] = useState(0)
  const [additionalPaymentStrategy, setAdditionalPaymentStrategy] =
    useState<AdditionalPaymentStrategy>('shorten-duration')
  const [showPlan, setShowPlan] = useState(false)
  const [selectedChartYear, setSelectedChartYear] = useState(0)

  const copy = TRANSLATIONS[language]

  const euroFormatter = useMemo(
    () =>
      new Intl.NumberFormat(EURO_NUMBER_LOCALE, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
    [],
  )

  const pdfCurrencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(EURO_NUMBER_LOCALE, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
    [],
  )

  const plan = useMemo(
    () =>
      calculateMortgagePlan({
        houseCost,
        downPayment,
        years,
        annualInterestRate: annualInterestRate / 100,
        monthlyBankCost,
        additionalAnnualPayment,
        additionalPaymentStrategy,
      }),
    [additionalAnnualPayment, additionalPaymentStrategy, annualInterestRate, downPayment, houseCost, monthlyBankCost, years],
  )

  const baselinePlan = useMemo(
    () =>
      calculateMortgagePlan({
        houseCost,
        downPayment,
        years,
        annualInterestRate: annualInterestRate / 100,
        monthlyBankCost,
        additionalAnnualPayment: 0,
      }),
    [annualInterestRate, downPayment, houseCost, monthlyBankCost, years],
  )

  const chartData = useMemo<ChartPoint[]>(() => {
    let reimbursedCapital = 0
    let paidInterest = 0

    const chartYears = Math.ceil(plan.installments.length / 12)
    const points: ChartPoint[] = [
      {
        year: 0,
        remainingCapital: plan.principal,
        reimbursedCapital: 0,
        paidInterest: 0,
      },
    ]

    for (let index = 0; index < chartYears; index += 1) {
      const year = index + 1
      const yearStart = index * 12
      const yearEnd = Math.min((index + 1) * 12, plan.installments.length)
      const yearInstallments = plan.installments.slice(yearStart, yearEnd)
      const installmentIndex = Math.min(yearEnd, plan.installments.length) - 1
      const installment = plan.installments[Math.max(installmentIndex, 0)]

      reimbursedCapital += yearInstallments.reduce((sum, currentInstallment) => sum + currentInstallment.principal, 0)
      paidInterest += yearInstallments.reduce((sum, currentInstallment) => sum + currentInstallment.interest, 0)

      points.push({
        year,
        remainingCapital: installment?.remainingPrincipal ?? 0,
        reimbursedCapital,
        paidInterest,
      })
    }

    return points
  }, [plan.installments, plan.principal])

  useEffect(() => {
    if (selectedChartYear > chartData.length - 1) {
      setSelectedChartYear(chartData.length - 1)
    }
  }, [chartData.length, selectedChartYear])

  const maxChartAmount = useMemo(
    () =>
      Math.max(
        ...chartData.map((point) => Math.max(point.remainingCapital, point.reimbursedCapital, point.paidInterest)),
        0,
      ),
    [chartData],
  )

  const selectedChartPoint = chartData[Math.max(selectedChartYear, 0)] ?? null
  const interestSaved = Math.max(baselinePlan.totalInterest - plan.totalInterest, 0)
  const monthsSaved = Math.max(baselinePlan.durationMonths - plan.durationMonths, 0)
  const durationSavedLabel = formatDurationLabel(monthsSaved)
  const loanPrincipal = Math.max(houseCost - downPayment, 0)
  const validationError =
    downPayment > houseCost
      ? copy.downPaymentExceedsHouseCostError
      : additionalAnnualPayment > loanPrincipal
        ? copy.additionalPaymentExceedsLoanError
        : null

  const handleExportPlanAsPdf = () => {
    if (validationError) {
      return
    }

    downloadMortgagePlanPdf({
      copy,
      formatter: pdfCurrencyFormatter,
      houseCost,
      downPayment,
      years,
      annualInterestRate,
      monthlyBankCost,
      additionalAnnualPayment,
      additionalPaymentStrategyLabel:
        additionalPaymentStrategy === 'shorten-duration' ? copy.shortenDurationStrategy : copy.reduceMonthlyPaymentStrategy,
      monthlyPayment: plan.monthlyPayment,
      totalCapitalPaid: plan.totalCapitalPaid,
      totalInterest: plan.totalInterest,
      totalAdditionalPayments: plan.totalAdditionalPayments,
      interestSaved,
      durationSavedLabel,
      totalCapitalAndInterest: plan.totalCapitalAndInterest,
      totalPaid: plan.totalPaid,
      totalBankCosts: plan.totalBankCosts,
      installments: plan.installments,
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">{copy.pageSubtitle}</p>

        <div className="mt-4 w-full max-w-sm">
          <label className="block" htmlFor="language">
            <span className="text-sm font-medium text-slate-200">{copy.languageLabel}</span>
            <select
              id="language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-400 focus:ring"
            >
              <option value="en">English</option>
              <option value="it">Italiano</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <form className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <InputField
              id="houseCost"
              label={copy.houseCost}
              value={houseCost}
              min={0}
              step={5000}
              onValueChange={setHouseCost}
              useGrouping
            />
            <InputField
              id="downPayment"
              label={copy.downPayment}
              value={downPayment}
              min={0}
              step={1000}
              onValueChange={setDownPayment}
              useGrouping
            />
            {downPayment > houseCost ? (
              <p className="text-sm font-medium text-rose-400">{copy.downPaymentExceedsHouseCostError}</p>
            ) : null}
            <InputField
              id="years"
              label={copy.mortgageDurationYears}
              value={years}
              min={1}
              step={1}
              onValueChange={setYears}
            />
            <InputField
              id="annualInterestRate"
              label={copy.annualInterestRate}
              value={annualInterestRate}
              min={0}
              max={100}
              step={0.01}
              fractionDigits={2}
              onValueChange={setAnnualInterestRate}
              hint={copy.annualInterestRateHint}
            />
            <InputField
              id="monthlyBankCost"
              label={copy.monthlyBankCost}
              value={monthlyBankCost}
              min={0}
              step={1}
              onValueChange={setMonthlyBankCost}
              useGrouping
              fractionDigits={2}
            />
            <InputField
              id="additionalAnnualPayment"
              label={copy.additionalAnnualPayment}
              value={additionalAnnualPayment}
              min={0}
              step={100}
              onValueChange={setAdditionalAnnualPayment}
              useGrouping
            />
            {additionalAnnualPayment > loanPrincipal ? (
              <p className="text-sm font-medium text-rose-400">{copy.additionalPaymentExceedsLoanError}</p>
            ) : null}
            <label className="block" htmlFor="additionalPaymentStrategy">
              <span className="text-sm font-medium text-slate-200">{copy.additionalPaymentStrategy}</span>
              <select
                id="additionalPaymentStrategy"
                value={additionalPaymentStrategy}
                onChange={(event) => setAdditionalPaymentStrategy(event.target.value as AdditionalPaymentStrategy)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-400 focus:ring"
              >
                <option value="shorten-duration">{copy.shortenDurationStrategy}</option>
                <option value="reduce-payment">{copy.reduceMonthlyPaymentStrategy}</option>
              </select>
            </label>
          </form>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <h2 className="text-lg font-semibold">{copy.summaryTitle}</h2>
            {validationError ? (
              <p className="mt-4 rounded-md border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {validationError}
              </p>
            ) : null}
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <SummaryItem label={copy.loanPrincipal} value={euroFormatter.format(plan.principal)} />
              <SummaryItem label={copy.monthlyPayment} value={euroFormatter.format(plan.monthlyPayment)} />
              <SummaryItem
                label={copy.monthlyRateWithoutBankCost}
                value={euroFormatter.format(plan.monthlyRateWithoutBankCost)}
              />
              <SummaryItem label={copy.totalCapitalPaid} value={euroFormatter.format(plan.totalCapitalPaid)} />
              <SummaryItem label={copy.totalInterest} value={euroFormatter.format(plan.totalInterest)} />
              <SummaryItem label={copy.totalAdditionalPayments} value={euroFormatter.format(plan.totalAdditionalPayments)} />
              <SummaryItem label={copy.totalCapitalAndInterest} value={euroFormatter.format(plan.totalCapitalAndInterest)} />
              <SummaryItem label={copy.totalBankCosts} value={euroFormatter.format(plan.totalBankCosts)} />
              <SummaryItem label={copy.totalPaid} value={euroFormatter.format(plan.totalPaid)} />
              {additionalAnnualPayment > 0 && !validationError ? (
                <>
                  <SummaryItem label={copy.interestSaved} value={euroFormatter.format(interestSaved)} />
                  <SummaryItem label={copy.durationSaved} value={durationSavedLabel} />
                </>
              ) : null}
            </dl>

            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="text-base font-semibold text-slate-100">{copy.chartTitle}</h3>
              <p className="mt-1 text-xs text-slate-400">{copy.chartSubtitle}</p>

              {chartData.length > 0 && !validationError ? (
                <>
                  <InteractiveChart
                    data={chartData}
                    maxAmount={maxChartAmount}
                    selectedYear={selectedChartYear}
                    onYearChange={setSelectedChartYear}
                  />

                  {selectedChartPoint ? (
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                      <ChartLegendValue
                        colorClassName="bg-violet-400"
                        label={`${copy.chartRemainingCapitalLegend} (${copy.yearLabel} ${selectedChartPoint.year})`}
                        value={euroFormatter.format(selectedChartPoint.remainingCapital)}
                      />
                      <ChartLegendValue
                        colorClassName="bg-emerald-400"
                        label={`${copy.chartReimbursedCapitalLegend} (${copy.yearLabel} ${selectedChartPoint.year})`}
                        value={euroFormatter.format(selectedChartPoint.reimbursedCapital)}
                      />
                      <ChartLegendValue
                        colorClassName="bg-cyan-400"
                        label={`${copy.chartInterestLegend} (${copy.yearLabel} ${selectedChartPoint.year})`}
                        value={euroFormatter.format(selectedChartPoint.paidInterest)}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPlan((current) => !current)}
                disabled={Boolean(validationError)}
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
              >
                {showPlan ? copy.hidePlan : copy.showPlan}
              </button>
              <button
                type="button"
                onClick={handleExportPlanAsPdf}
                disabled={Boolean(validationError)}
                className="rounded-md border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
              >
                {copy.exportPlanAsPdf}
              </button>
            </div>

            {showPlan && !validationError ? (
              <ul className="mt-5 space-y-3">
                {plan.installments.map((installment) => (
                  <li
                    key={installment.month}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs sm:text-sm"
                  >
                    <p className="font-semibold text-emerald-300">{copy.monthWithNumber(installment.month)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <PlanValue label={copy.payment} value={euroFormatter.format(installment.payment)} />
                      <PlanValue label={copy.principal} value={euroFormatter.format(installment.principal)} />
                      <PlanValue label={copy.interest} value={euroFormatter.format(installment.interest)} />
                      <PlanValue label={copy.bankCost} value={euroFormatter.format(installment.bankCost)} />
                      <PlanValue
                        label={copy.additionalPayment}
                        value={euroFormatter.format(installment.additionalPayment)}
                      />
                      <PlanValue label={copy.remainingCapital} value={euroFormatter.format(installment.remainingPrincipal)} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {showPlan && !validationError ? (
              <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                <h3 className="text-base font-semibold text-emerald-200">{copy.planTotals}</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <PlanValue label={copy.capitalPaid} value={euroFormatter.format(plan.totalCapitalPaid)} />
                  <PlanValue label={copy.interestPaid} value={euroFormatter.format(plan.totalInterest)} />
                  <PlanValue label={copy.totalAdditionalPayments} value={euroFormatter.format(plan.totalAdditionalPayments)} />
                  <PlanValue label={copy.capitalPlusInterest} value={euroFormatter.format(plan.totalCapitalAndInterest)} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
