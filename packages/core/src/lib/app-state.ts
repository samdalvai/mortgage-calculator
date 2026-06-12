import type { AdditionalPaymentStrategy, MortgagePlan } from './mortgage'
import type { SupportedLanguage } from '../i18n/translations'

export const STORAGE_KEY = 'mortgage-calculator:inputs'
export const ARCHIVE_STORAGE_KEY = 'mortgage-calculator:archived-plans'
export const MAX_ARCHIVED_PLANS = 20

export const LANGUAGE_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-US',
  it: 'it-IT',
  fr: 'fr-FR',
  de: 'de-DE',
}

export const SUPPORTED_LANGUAGE_OPTIONS: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
]

export type PersistedInputs = {
  language: SupportedLanguage
  houseCost: number
  downPayment: number
  years: number
  annualInterestRate: number
  monthlyBankCost: number
  additionalAnnualPayment: number
  additionalPaymentStrategy: AdditionalPaymentStrategy
}

export type ArchivedPlanInputs = Omit<PersistedInputs, 'language'>

export type ArchivedPlan = {
  id: string
  name: string
  createdAt: string
  inputs: ArchivedPlanInputs
}

export type ChartPoint = {
  year: number
  remainingCapital: number
  reimbursedCapital: number
  paidInterest: number
}

export type ValidationErrorKind = 'down-payment-exceeds-house-cost' | 'additional-payment-exceeds-loan' | null

export const createDefaultInputs = (language: SupportedLanguage = 'en'): PersistedInputs => ({
  language,
  houseCost: 250000,
  downPayment: 50000,
  years: 25,
  annualInterestRate: 3,
  monthlyBankCost: 0,
  additionalAnnualPayment: 0,
  additionalPaymentStrategy: 'shorten-duration',
})

export const toPersistedInputs = (
  parsed: Partial<PersistedInputs>,
  fallbackInputs: PersistedInputs = createDefaultInputs(),
): PersistedInputs => ({
  language:
    parsed.language && ['en', 'it', 'fr', 'de'].includes(parsed.language) ? parsed.language : fallbackInputs.language,
  houseCost: typeof parsed.houseCost === 'number' ? parsed.houseCost : fallbackInputs.houseCost,
  downPayment: typeof parsed.downPayment === 'number' ? parsed.downPayment : fallbackInputs.downPayment,
  years: typeof parsed.years === 'number' ? parsed.years : fallbackInputs.years,
  annualInterestRate:
    typeof parsed.annualInterestRate === 'number' ? parsed.annualInterestRate : fallbackInputs.annualInterestRate,
  monthlyBankCost: typeof parsed.monthlyBankCost === 'number' ? parsed.monthlyBankCost : fallbackInputs.monthlyBankCost,
  additionalAnnualPayment:
    typeof parsed.additionalAnnualPayment === 'number'
      ? parsed.additionalAnnualPayment
      : fallbackInputs.additionalAnnualPayment,
  additionalPaymentStrategy:
    parsed.additionalPaymentStrategy === 'reduce-payment' || parsed.additionalPaymentStrategy === 'shorten-duration'
      ? parsed.additionalPaymentStrategy
      : fallbackInputs.additionalPaymentStrategy,
})

export const parsePersistedInputs = (
  rawInputs: string | null | undefined,
  fallbackInputs: PersistedInputs = createDefaultInputs(),
): PersistedInputs => {
  if (!rawInputs) {
    return fallbackInputs
  }

  try {
    const parsed = JSON.parse(rawInputs) as Partial<PersistedInputs>
    return toPersistedInputs(parsed, fallbackInputs)
  } catch {
    return fallbackInputs
  }
}

export const parseArchivedPlans = (
  rawPlans: string | null | undefined,
  fallbackInputs: PersistedInputs = createDefaultInputs(),
): ArchivedPlan[] => {
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

        const inputs = toPersistedInputs(candidate.inputs, fallbackInputs)

        return {
          id: candidate.id,
          name: candidate.name,
          createdAt: candidate.createdAt,
          inputs: {
            houseCost: inputs.houseCost,
            downPayment: inputs.downPayment,
            years: inputs.years,
            annualInterestRate: inputs.annualInterestRate,
            monthlyBankCost: inputs.monthlyBankCost,
            additionalAnnualPayment: inputs.additionalAnnualPayment,
            additionalPaymentStrategy: inputs.additionalPaymentStrategy,
          },
        }
      })
      .filter((plan): plan is ArchivedPlan => plan !== null)
      .slice(0, MAX_ARCHIVED_PLANS)
  } catch {
    return []
  }
}

export const getValidationErrorKind = ({
  houseCost,
  downPayment,
  additionalAnnualPayment,
}: Pick<PersistedInputs, 'houseCost' | 'downPayment' | 'additionalAnnualPayment'>): ValidationErrorKind => {
  const loanPrincipal = Math.max(houseCost - downPayment, 0)

  if (downPayment > houseCost) {
    return 'down-payment-exceeds-house-cost'
  }

  if (additionalAnnualPayment > loanPrincipal) {
    return 'additional-payment-exceeds-loan'
  }

  return null
}

export const buildChartData = (plan: MortgagePlan): ChartPoint[] => {
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
}

export const getMaxChartAmount = (chartData: ChartPoint[]) =>
  Math.max(
    ...chartData.map((point) => Math.max(point.remainingCapital, point.reimbursedCapital, point.paidInterest)),
    0,
  )
