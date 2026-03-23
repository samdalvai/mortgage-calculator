import { useEffect, useMemo, useState } from 'react'

import { ChartLegendValue, PlanValue, SummaryItem } from './components/DisplayValue'
import { InputField } from './components/InputField'
import { InteractiveChart, type ChartPoint } from './components/InteractiveChart'
import { TRANSLATIONS, getBrowserLanguage, type SupportedLanguage } from './i18n/translations'
import { EURO_NUMBER_LOCALE, formatDurationLabel } from './lib/formatting'
import { calculateMortgagePlan, type AdditionalPaymentStrategy } from './lib/mortgage'
import { downloadMortgagePlanPdf } from './lib/pdf'

const STORAGE_KEY = 'mortgage-calculator:inputs'
const ARCHIVE_STORAGE_KEY = 'mortgage-calculator:archived-plans'
const MAX_ARCHIVED_PLANS = 20
const LANGUAGE_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-US',
  it: 'it-IT',
  fr: 'fr-FR',
  de: 'de-DE',
}

type PersistedInputs = {
  language: SupportedLanguage
  houseCost: number
  downPayment: number
  years: number
  annualInterestRate: number
  monthlyBankCost: number
  additionalAnnualPayment: number
  additionalPaymentStrategy: AdditionalPaymentStrategy
}

type ArchivedPlanInputs = Omit<PersistedInputs, 'language'>

type ArchivedPlan = {
  id: string
  name: string
  createdAt: string
  inputs: ArchivedPlanInputs
}

const DEFAULT_INPUTS: PersistedInputs = {
  language: getBrowserLanguage(),
  houseCost: 250000,
  downPayment: 50000,
  years: 25,
  annualInterestRate: 3,
  monthlyBankCost: 0,
  additionalAnnualPayment: 0,
  additionalPaymentStrategy: 'shorten-duration',
}

const toPersistedInputs = (parsed: Partial<PersistedInputs>): PersistedInputs => ({
  language:
    parsed.language && ['en', 'it', 'fr', 'de'].includes(parsed.language) ? parsed.language : DEFAULT_INPUTS.language,
  houseCost: typeof parsed.houseCost === 'number' ? parsed.houseCost : DEFAULT_INPUTS.houseCost,
  downPayment: typeof parsed.downPayment === 'number' ? parsed.downPayment : DEFAULT_INPUTS.downPayment,
  years: typeof parsed.years === 'number' ? parsed.years : DEFAULT_INPUTS.years,
  annualInterestRate:
    typeof parsed.annualInterestRate === 'number' ? parsed.annualInterestRate : DEFAULT_INPUTS.annualInterestRate,
  monthlyBankCost: typeof parsed.monthlyBankCost === 'number' ? parsed.monthlyBankCost : DEFAULT_INPUTS.monthlyBankCost,
  additionalAnnualPayment:
    typeof parsed.additionalAnnualPayment === 'number'
      ? parsed.additionalAnnualPayment
      : DEFAULT_INPUTS.additionalAnnualPayment,
  additionalPaymentStrategy:
    parsed.additionalPaymentStrategy === 'reduce-payment' || parsed.additionalPaymentStrategy === 'shorten-duration'
      ? parsed.additionalPaymentStrategy
      : DEFAULT_INPUTS.additionalPaymentStrategy,
})

const readPersistedInputs = (): PersistedInputs => {
  if (typeof window === 'undefined') {
    return DEFAULT_INPUTS
  }

  const rawInputs = window.localStorage.getItem(STORAGE_KEY)

  if (!rawInputs) {
    return DEFAULT_INPUTS
  }

  try {
    const parsed = JSON.parse(rawInputs) as Partial<PersistedInputs>
    return toPersistedInputs(parsed)
  } catch {
    return DEFAULT_INPUTS
  }
}

const readArchivedPlans = (): ArchivedPlan[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const rawPlans = window.localStorage.getItem(ARCHIVE_STORAGE_KEY)
  if (!rawPlans) {
    return []
  }

  try {
    const parsed = JSON.parse(rawPlans)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item): ArchivedPlan | null => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const candidate = item as Partial<ArchivedPlan> & { inputs?: Partial<PersistedInputs> }
        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.name !== 'string' ||
          typeof candidate.createdAt !== 'string' ||
          !candidate.inputs
        ) {
          return null
        }

        return {
          id: candidate.id,
          name: candidate.name,
          createdAt: candidate.createdAt,
          inputs: {
            houseCost: typeof candidate.inputs.houseCost === 'number' ? candidate.inputs.houseCost : DEFAULT_INPUTS.houseCost,
            downPayment:
              typeof candidate.inputs.downPayment === 'number' ? candidate.inputs.downPayment : DEFAULT_INPUTS.downPayment,
            years: typeof candidate.inputs.years === 'number' ? candidate.inputs.years : DEFAULT_INPUTS.years,
            annualInterestRate:
              typeof candidate.inputs.annualInterestRate === 'number'
                ? candidate.inputs.annualInterestRate
                : DEFAULT_INPUTS.annualInterestRate,
            monthlyBankCost:
              typeof candidate.inputs.monthlyBankCost === 'number'
                ? candidate.inputs.monthlyBankCost
                : DEFAULT_INPUTS.monthlyBankCost,
            additionalAnnualPayment:
              typeof candidate.inputs.additionalAnnualPayment === 'number'
                ? candidate.inputs.additionalAnnualPayment
                : DEFAULT_INPUTS.additionalAnnualPayment,
            additionalPaymentStrategy:
              candidate.inputs.additionalPaymentStrategy === 'reduce-payment' ||
              candidate.inputs.additionalPaymentStrategy === 'shorten-duration'
                ? candidate.inputs.additionalPaymentStrategy
                : DEFAULT_INPUTS.additionalPaymentStrategy,
          },
        }
      })
      .filter((plan): plan is ArchivedPlan => plan !== null)
      .slice(0, MAX_ARCHIVED_PLANS)
  } catch {
    return []
  }
}

function App() {
  const storedInputs = useMemo(() => readPersistedInputs(), [])
  const [language, setLanguage] = useState<SupportedLanguage>(storedInputs.language)
  const [houseCost, setHouseCost] = useState(storedInputs.houseCost)
  const [downPayment, setDownPayment] = useState(storedInputs.downPayment)
  const [years, setYears] = useState(storedInputs.years)
  const [annualInterestRate, setAnnualInterestRate] = useState(storedInputs.annualInterestRate)
  const [monthlyBankCost, setMonthlyBankCost] = useState(storedInputs.monthlyBankCost)
  const [additionalAnnualPayment, setAdditionalAnnualPayment] = useState(storedInputs.additionalAnnualPayment)
  const [additionalPaymentStrategy, setAdditionalPaymentStrategy] =
    useState<AdditionalPaymentStrategy>(storedInputs.additionalPaymentStrategy)
  const [showPlan, setShowPlan] = useState(false)
  const [selectedChartYear, setSelectedChartYear] = useState(0)
  const [archivedPlans, setArchivedPlans] = useState<ArchivedPlan[]>(() => readArchivedPlans())
  const [archivedPlanDraftNames, setArchivedPlanDraftNames] = useState<Record<string, string>>({})
  const [archiveName, setArchiveName] = useState('')
  const [archiveFeedback, setArchiveFeedback] = useState<string | null>(null)

  const copy = TRANSLATIONS[language]
  const archiveDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(LANGUAGE_LOCALE[language], {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language],
  )

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language,
        houseCost,
        downPayment,
        years,
        annualInterestRate,
        monthlyBankCost,
        additionalAnnualPayment,
        additionalPaymentStrategy,
      } satisfies PersistedInputs),
    )
  }, [
    additionalAnnualPayment,
    additionalPaymentStrategy,
    annualInterestRate,
    downPayment,
    houseCost,
    language,
    monthlyBankCost,
    years,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedPlans))
  }, [archivedPlans])

  useEffect(() => {
    setArchivedPlanDraftNames((currentDraftNames) => {
      const nextDraftNames: Record<string, string> = {}

      archivedPlans.forEach((planItem) => {
        nextDraftNames[planItem.id] = currentDraftNames[planItem.id] ?? planItem.name
      })

      return nextDraftNames
    })
  }, [archivedPlans])

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

  const applyInputs = (inputs: ArchivedPlanInputs) => {
    setHouseCost(inputs.houseCost)
    setDownPayment(inputs.downPayment)
    setYears(inputs.years)
    setAnnualInterestRate(inputs.annualInterestRate)
    setMonthlyBankCost(inputs.monthlyBankCost)
    setAdditionalAnnualPayment(inputs.additionalAnnualPayment)
    setAdditionalPaymentStrategy(inputs.additionalPaymentStrategy)
    setSelectedChartYear(0)
  }

  const handleArchiveCurrentPlan = () => {
    if (validationError) {
      return
    }

    const name = archiveName.trim()
    const resolvedName = name || copy.archiveDefaultName(new Date())
    const archivedItem: ArchivedPlan = {
      id: crypto.randomUUID(),
      name: resolvedName,
      createdAt: new Date().toISOString(),
      inputs: {
        houseCost,
        downPayment,
        years,
        annualInterestRate,
        monthlyBankCost,
        additionalAnnualPayment,
        additionalPaymentStrategy,
      },
    }

    setArchivedPlans((currentPlans) => [archivedItem, ...currentPlans].slice(0, MAX_ARCHIVED_PLANS))
    setArchiveName('')
    setArchiveFeedback(copy.archiveSavedMessage(resolvedName))
  }

  const handleRestoreArchivedPlan = (archivedPlan: ArchivedPlan) => {
    applyInputs(archivedPlan.inputs)
    setArchiveFeedback(copy.archiveRestoredMessage(archivedPlan.name))
    setShowPlan(true)
  }

  const handleDeleteArchivedPlan = (archivedPlan: ArchivedPlan) => {
    setArchivedPlans((currentPlans) => currentPlans.filter((planItem) => planItem.id !== archivedPlan.id))
    setArchiveFeedback(copy.archiveDeletedMessage(archivedPlan.name))
  }

  const handleSaveCurrentChangesToArchivedPlan = (archivedPlan: ArchivedPlan) => {
    const candidateName = archivedPlanDraftNames[archivedPlan.id]?.trim()
    const resolvedName = candidateName || archivedPlan.name

    setArchivedPlans((currentPlans) =>
      currentPlans.map((planItem) =>
        planItem.id === archivedPlan.id
          ? {
              ...planItem,
              name: resolvedName,
              inputs: {
                houseCost,
                downPayment,
                years,
                annualInterestRate,
                monthlyBankCost,
                additionalAnnualPayment,
                additionalPaymentStrategy,
              },
            }
          : planItem,
      ),
    )
    setArchiveFeedback(copy.archiveUpdatedMessage(resolvedName))
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
                onClick={handleArchiveCurrentPlan}
                disabled={Boolean(validationError)}
                className="rounded-md border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
              >
                {copy.archivePlan}
              </button>
              <button
                type="button"
                onClick={handleExportPlanAsPdf}
                disabled={Boolean(validationError)}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
              >
                <span aria-hidden="true">⬇️</span>
                {copy.exportPlanAsPdf}
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="text-base font-semibold text-slate-100">{copy.archiveSectionTitle}</h3>
              <div className="mt-3 grid gap-3">
                <label className="block" htmlFor="archiveName">
                  <span className="text-sm font-medium text-slate-200">{copy.archiveNameLabel}</span>
                  <input
                    id="archiveName"
                    type="text"
                    value={archiveName}
                    onChange={(event) => setArchiveName(event.target.value)}
                    placeholder={copy.archiveNamePlaceholder}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 focus:ring"
                  />
                </label>

                {archivedPlans.length > 0 ? (
                  <ul className="space-y-2">
                    {archivedPlans.map((planItem) => (
                      <li key={planItem.id} className="space-y-3 rounded-md border border-slate-700 bg-slate-900/60 p-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={archivedPlanDraftNames[planItem.id] ?? planItem.name}
                            onChange={(event) =>
                              setArchivedPlanDraftNames((currentDraftNames) => ({
                                ...currentDraftNames,
                                [planItem.id]: event.target.value,
                              }))
                            }
                            placeholder={copy.archiveNamePlaceholder}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 outline-none ring-cyan-400 focus:ring"
                          />
                          <p className="text-xs text-slate-400">
                            {copy.archivedOn(archiveDateFormatter.format(new Date(planItem.createdAt)))}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleSaveCurrentChangesToArchivedPlan(planItem)}
                            disabled={Boolean(validationError)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-500 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span aria-hidden="true">💾</span>
                            {copy.saveArchivedPlanChanges}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRestoreArchivedPlan(planItem)}
                            className="w-full rounded-md border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
                          >
                            {copy.selectArchivedPlan}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArchivedPlan(planItem)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-rose-500 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 sm:col-span-2"
                          >
                            <span aria-hidden="true">🗑️</span>
                            {copy.deleteArchivedPlan}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">{copy.noArchivedPlans}</p>
                )}
                {archiveFeedback ? <p className="text-sm text-cyan-300">{archiveFeedback}</p> : null}
              </div>
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
