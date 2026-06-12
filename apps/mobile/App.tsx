import { useEffect, useMemo, useState } from 'react'
import * as FileSystem from 'expo-file-system'
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import {
  ARCHIVE_STORAGE_KEY,
  EURO_NUMBER_LOCALE,
  LANGUAGE_LOCALE,
  MAX_ARCHIVED_PLANS,
  STORAGE_KEY,
  SUPPORTED_LANGUAGE_OPTIONS,
  TRANSLATIONS,
  buildChartData,
  calculateMortgagePlan,
  createDefaultInputs,
  createMortgagePlanPdfDocument,
  formatDurationLabel,
  getMaxChartAmount,
  getValidationErrorKind,
  parseArchivedPlans,
  parsePersistedInputs,
  type AdditionalPaymentStrategy,
  type ArchivedPlan,
  type ArchivedPlanInputs,
  type ChartPoint,
  type PersistedInputs,
  type SupportedLanguage,
  type Translation,
} from '../../packages/core/src'

type NumberInputProps = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  hint?: string
  fractionDigits?: number
  useGrouping?: boolean
  onValueChange: (value: number) => void
}

type SummaryItemProps = {
  label: string
  value: string
}

type ChartBarProps = SummaryItemProps & {
  color: string
  maxAmount: number
  rawValue: number
}

type ActionButtonProps = {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'muted'
  disabled?: boolean
  onPress: () => void
}

const DATA_DIRECTORY = `${FileSystem.documentDirectory ?? ''}mortgage-calculator/`
const INPUTS_FILE = `${DATA_DIRECTORY}${STORAGE_KEY}.json`
const ARCHIVE_FILE = `${DATA_DIRECTORY}${ARCHIVE_STORAGE_KEY}.json`
const DEFAULT_INPUTS = createDefaultInputs()

const parseEuropeanNumber = (rawValue: string): number => {
  const normalized = rawValue
    .replace(/\./g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
  return Number(normalized)
}

const countFractionDigits = (stepValue: number): number => {
  const normalized = stepValue.toString().toLowerCase()
  if (normalized.includes('e-')) {
    return Number(normalized.split('e-')[1])
  }

  const decimals = normalized.split('.')[1]
  return decimals ? decimals.length : 0
}

const roundToDigits = (value: number, digits: number): number => {
  if (digits <= 0) {
    return Math.round(value)
  }

  return Number(value.toFixed(digits))
}

const clampValue = (value: number, min?: number, max?: number) =>
  Math.max(min ?? Number.NEGATIVE_INFINITY, Math.min(max ?? Number.POSITIVE_INFINITY, value))

const formatEuropeanNumber = (value: number, fractionDigits: number, useGrouping: boolean): string =>
  new Intl.NumberFormat(EURO_NUMBER_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping,
  }).format(value)

const ensureDataDirectory = async () => {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document directory is unavailable.')
  }

  const directoryInfo = await FileSystem.getInfoAsync(DATA_DIRECTORY)
  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(DATA_DIRECTORY, { intermediates: true })
  }
}

const readStorageFile = async (path: string) => {
  const fileInfo = await FileSystem.getInfoAsync(path)
  if (!fileInfo.exists) {
    return null
  }

  return FileSystem.readAsStringAsync(path)
}

const writeStorageFile = async (path: string, contents: string) => {
  await ensureDataDirectory()
  await FileSystem.writeAsStringAsync(path, contents, { encoding: FileSystem.EncodingType.UTF8 })
}

const createArchiveId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  hint,
  fractionDigits,
  useGrouping = false,
  onValueChange,
}: NumberInputProps) {
  const resolvedFractionDigits = fractionDigits ?? countFractionDigits(step ?? 1)
  const [draftValue, setDraftValue] = useState(formatEuropeanNumber(value, resolvedFractionDigits, useGrouping))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(formatEuropeanNumber(value, resolvedFractionDigits, useGrouping))
    }
  }, [isFocused, resolvedFractionDigits, useGrouping, value])

  const commitValue = (rawValue: string) => {
    if (rawValue === '') {
      onValueChange(clampValue(0, min, max))
      return
    }

    const parsedValue = parseEuropeanNumber(rawValue)
    if (Number.isNaN(parsedValue)) {
      return
    }

    onValueChange(clampValue(roundToDigits(parsedValue, resolvedFractionDigits), min, max))
  }

  const handleStepChange = (direction: 'increase' | 'decrease') => {
    const increment = step ?? 1
    const parsedDraftValue = parseEuropeanNumber(draftValue)
    const baseValue = Number.isNaN(parsedDraftValue) ? value : parsedDraftValue
    const nextValue = direction === 'increase' ? baseValue + increment : baseValue - increment
    const clampedValue = clampValue(roundToDigits(nextValue, resolvedFractionDigits), min, max)
    onValueChange(clampedValue)
    setDraftValue(formatEuropeanNumber(clampedValue, resolvedFractionDigits, useGrouping))
  }

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
          onPress={() => handleStepChange('decrease')}
        >
          <Text style={styles.stepButtonText}>-</Text>
        </Pressable>
        <TextInput
          keyboardType="decimal-pad"
          value={draftValue}
          onFocus={() => {
            setIsFocused(true)
            if (parseEuropeanNumber(draftValue) === 0) {
              setDraftValue('')
            }
          }}
          onBlur={() => {
            setIsFocused(false)
            if (draftValue === '') {
              const clampedZero = clampValue(0, min, max)
              onValueChange(clampedZero)
              setDraftValue(formatEuropeanNumber(clampedZero, resolvedFractionDigits, useGrouping))
              return
            }

            const parsedValue = parseEuropeanNumber(draftValue)
            if (Number.isNaN(parsedValue)) {
              setDraftValue(formatEuropeanNumber(value, resolvedFractionDigits, useGrouping))
              return
            }

            const clampedValue = clampValue(roundToDigits(parsedValue, resolvedFractionDigits), min, max)
            onValueChange(clampedValue)
            setDraftValue(formatEuropeanNumber(clampedValue, resolvedFractionDigits, useGrouping))
          }}
          onChangeText={(rawInput) => {
            setDraftValue(rawInput)
            commitValue(rawInput)
          }}
          style={styles.input}
          placeholderTextColor="#64748b"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
          onPress={() => handleStepChange('increase')}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

function PlanValue({ label, value }: SummaryItemProps) {
  return (
    <View style={styles.planValue}>
      <Text style={styles.planValueLabel}>{label}</Text>
      <Text style={styles.planValueText}>{value}</Text>
    </View>
  )
}

function ActionButton({ label, variant = 'secondary', disabled = false, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'primary' && styles.primaryButton,
        variant === 'danger' && styles.dangerButton,
        variant === 'muted' && styles.mutedButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'primary' && styles.primaryButtonText,
          variant === 'danger' && styles.dangerButtonText,
          variant === 'muted' && styles.mutedButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function ChartBar({ label, value, rawValue, color, maxAmount }: ChartBarProps) {
  const widthPercent = maxAmount <= 0 ? 0 : Math.max(2, Math.min(100, (rawValue / maxAmount) * 100))

  return (
    <View style={styles.chartBarGroup}>
      <View style={styles.chartBarHeader}>
        <Text style={styles.chartBarLabel}>{label}</Text>
        <Text style={styles.chartBarValue}>{value}</Text>
      </View>
      <View style={styles.chartTrack}>
        <View style={[styles.chartFill, { width: `${widthPercent}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

function NativeChart({
  copy,
  data,
  formatter,
  maxAmount,
  selectedYear,
  onYearChange,
}: {
  copy: Translation
  data: ChartPoint[]
  formatter: Intl.NumberFormat
  maxAmount: number
  selectedYear: number
  onYearChange: (year: number) => void
}) {
  const maxYear = Math.max(data.length - 1, 0)
  const selectedPoint = data[Math.min(Math.max(selectedYear, 0), maxYear)] ?? null

  if (!selectedPoint) {
    return null
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>{copy.chartTitle}</Text>
      <Text style={styles.hint}>{copy.chartSubtitle}</Text>
      <View style={styles.yearControls}>
        <ActionButton
          label="<"
          variant="muted"
          disabled={selectedYear <= 0}
          onPress={() => onYearChange(Math.max(selectedYear - 1, 0))}
        />
        <View style={styles.yearPill}>
          <Text style={styles.yearPillText}>
            {copy.yearLabel} {selectedPoint.year}
          </Text>
        </View>
        <ActionButton
          label=">"
          variant="muted"
          disabled={selectedYear >= maxYear}
          onPress={() => onYearChange(Math.min(selectedYear + 1, maxYear))}
        />
      </View>
      <ChartBar
        label={copy.chartRemainingCapitalLegend}
        value={formatter.format(selectedPoint.remainingCapital)}
        rawValue={selectedPoint.remainingCapital}
        maxAmount={maxAmount}
        color="#a78bfa"
      />
      <ChartBar
        label={copy.chartReimbursedCapitalLegend}
        value={formatter.format(selectedPoint.reimbursedCapital)}
        rawValue={selectedPoint.reimbursedCapital}
        maxAmount={maxAmount}
        color="#34d399"
      />
      <ChartBar
        label={copy.chartInterestLegend}
        value={formatter.format(selectedPoint.paidInterest)}
        rawValue={selectedPoint.paidInterest}
        maxAmount={maxAmount}
        color="#22d3ee"
      />
    </View>
  )
}

export default function App() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_INPUTS.language)
  const [houseCost, setHouseCost] = useState(DEFAULT_INPUTS.houseCost)
  const [downPayment, setDownPayment] = useState(DEFAULT_INPUTS.downPayment)
  const [years, setYears] = useState(DEFAULT_INPUTS.years)
  const [annualInterestRate, setAnnualInterestRate] = useState(DEFAULT_INPUTS.annualInterestRate)
  const [monthlyBankCost, setMonthlyBankCost] = useState(DEFAULT_INPUTS.monthlyBankCost)
  const [additionalAnnualPayment, setAdditionalAnnualPayment] = useState(DEFAULT_INPUTS.additionalAnnualPayment)
  const [additionalPaymentStrategy, setAdditionalPaymentStrategy] =
    useState<AdditionalPaymentStrategy>(DEFAULT_INPUTS.additionalPaymentStrategy)
  const [showPlan, setShowPlan] = useState(false)
  const [selectedChartYear, setSelectedChartYear] = useState(0)
  const [archivedPlans, setArchivedPlans] = useState<ArchivedPlan[]>([])
  const [archivedPlanDraftNames, setArchivedPlanDraftNames] = useState<Record<string, string>>({})
  const [archiveName, setArchiveName] = useState('')
  const [archiveFeedback, setArchiveFeedback] = useState<string | null>(null)
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null)

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

  const chartData = useMemo(() => buildChartData(plan), [plan])
  const maxChartAmount = useMemo(() => getMaxChartAmount(chartData), [chartData])
  const interestSaved = Math.max(baselinePlan.totalInterest - plan.totalInterest, 0)
  const monthsSaved = Math.max(baselinePlan.durationMonths - plan.durationMonths, 0)
  const durationSavedLabel = formatDurationLabel(monthsSaved)
  const loanPrincipal = Math.max(houseCost - downPayment, 0)
  const validationErrorKind = getValidationErrorKind({ houseCost, downPayment, additionalAnnualPayment })
  const validationError =
    validationErrorKind === 'down-payment-exceeds-house-cost'
      ? copy.downPaymentExceedsHouseCostError
      : validationErrorKind === 'additional-payment-exceeds-loan'
        ? copy.additionalPaymentExceedsLoanError
        : null

  useEffect(() => {
    let active = true

    const hydrate = async () => {
      try {
        await ensureDataDirectory()
        const [rawInputs, rawArchive] = await Promise.all([readStorageFile(INPUTS_FILE), readStorageFile(ARCHIVE_FILE)])
        const storedInputs = parsePersistedInputs(rawInputs, DEFAULT_INPUTS)
        const storedArchivedPlans = parseArchivedPlans(rawArchive, storedInputs)

        if (!active) {
          return
        }

        applyInputs(storedInputs)
        setLanguage(storedInputs.language)
        setArchivedPlans(storedArchivedPlans)
      } catch (error) {
        if (active) {
          setStorageFeedback(error instanceof Error ? error.message : 'Unable to read saved data.')
        }
      } finally {
        if (active) {
          setIsHydrated(true)
        }
      }
    }

    hydrate()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const inputs: PersistedInputs = {
      language,
      houseCost,
      downPayment,
      years,
      annualInterestRate,
      monthlyBankCost,
      additionalAnnualPayment,
      additionalPaymentStrategy,
    }

    writeStorageFile(INPUTS_FILE, JSON.stringify(inputs)).catch((error) => {
      setStorageFeedback(error instanceof Error ? error.message : 'Unable to save inputs.')
    })
  }, [
    additionalAnnualPayment,
    additionalPaymentStrategy,
    annualInterestRate,
    downPayment,
    houseCost,
    isHydrated,
    language,
    monthlyBankCost,
    years,
  ])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    writeStorageFile(ARCHIVE_FILE, JSON.stringify(archivedPlans)).catch((error) => {
      setStorageFeedback(error instanceof Error ? error.message : 'Unable to save archived plans.')
    })
  }, [archivedPlans, isHydrated])

  useEffect(() => {
    setArchivedPlanDraftNames((currentDraftNames) => {
      const nextDraftNames: Record<string, string> = {}
      archivedPlans.forEach((planItem) => {
        nextDraftNames[planItem.id] = currentDraftNames[planItem.id] ?? planItem.name
      })
      return nextDraftNames
    })
  }, [archivedPlans])

  useEffect(() => {
    if (selectedChartYear > chartData.length - 1) {
      setSelectedChartYear(Math.max(chartData.length - 1, 0))
    }
  }, [chartData.length, selectedChartYear])

  const applyInputs = (inputs: ArchivedPlanInputs | PersistedInputs) => {
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
      id: createArchiveId(),
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

  const handleExportPlanAsPdf = async () => {
    if (validationError) {
      return
    }

    try {
      const pdfDocument = createMortgagePlanPdfDocument({
        copy,
        formatter: euroFormatter,
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
      const fileUri = `${DATA_DIRECTORY}mortgage-plan-${new Date().toISOString().slice(0, 10)}.pdf`
      await writeStorageFile(fileUri, pdfDocument)
      setArchiveFeedback(`${copy.exportPlanAsPdf}: ${fileUri}`)
      Alert.alert(copy.exportPlanAsPdf, fileUri)
    } catch (error) {
      Alert.alert(copy.exportPlanAsPdf, error instanceof Error ? error.message : 'Unable to export PDF.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{copy.pageTitle}</Text>
          <Text style={styles.subtitle}>{copy.pageSubtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.languageLabel}</Text>
          <SegmentedControl
            value={language}
            options={SUPPORTED_LANGUAGE_OPTIONS.map((option) => ({ value: option.code, label: option.label }))}
            onChange={setLanguage}
          />
        </View>

        <View style={styles.card}>
          <NumberInput label={copy.houseCost} value={houseCost} min={0} step={5000} onValueChange={setHouseCost} useGrouping />
          <NumberInput label={copy.downPayment} value={downPayment} min={0} step={1000} onValueChange={setDownPayment} useGrouping />
          {downPayment > houseCost ? <Text style={styles.errorText}>{copy.downPaymentExceedsHouseCostError}</Text> : null}
          <NumberInput label={copy.mortgageDurationYears} value={years} min={1} step={1} onValueChange={setYears} />
          <NumberInput
            label={copy.annualInterestRate}
            value={annualInterestRate}
            min={0}
            max={100}
            step={0.01}
            fractionDigits={2}
            onValueChange={setAnnualInterestRate}
            hint={copy.annualInterestRateHint}
          />
          <NumberInput
            label={copy.monthlyBankCost}
            value={monthlyBankCost}
            min={0}
            step={1}
            onValueChange={setMonthlyBankCost}
            useGrouping
            fractionDigits={2}
          />
          <NumberInput
            label={copy.additionalAnnualPayment}
            value={additionalAnnualPayment}
            min={0}
            step={100}
            onValueChange={setAdditionalAnnualPayment}
            useGrouping
          />
          {additionalAnnualPayment > loanPrincipal ? (
            <Text style={styles.errorText}>{copy.additionalPaymentExceedsLoanError}</Text>
          ) : null}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{copy.additionalPaymentStrategy}</Text>
            <SegmentedControl
              value={additionalPaymentStrategy}
              options={[
                { value: 'shorten-duration', label: copy.shortenDurationStrategy },
                { value: 'reduce-payment', label: copy.reduceMonthlyPaymentStrategy },
              ]}
              onChange={setAdditionalPaymentStrategy}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.summaryTitle}</Text>
          {validationError ? <Text style={styles.errorBanner}>{validationError}</Text> : null}
          <View style={styles.summaryGrid}>
            <SummaryItem label={copy.loanPrincipal} value={euroFormatter.format(plan.principal)} />
            <SummaryItem label={copy.monthlyPayment} value={euroFormatter.format(plan.monthlyPayment)} />
            <SummaryItem label={copy.monthlyRateWithoutBankCost} value={euroFormatter.format(plan.monthlyRateWithoutBankCost)} />
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
          </View>

          {!validationError ? (
            <NativeChart
              copy={copy}
              data={chartData}
              formatter={euroFormatter}
              maxAmount={maxChartAmount}
              selectedYear={selectedChartYear}
              onYearChange={setSelectedChartYear}
            />
          ) : null}

          <View style={styles.actions}>
            <ActionButton
              label={showPlan ? copy.hidePlan : copy.showPlan}
              variant="primary"
              disabled={Boolean(validationError)}
              onPress={() => setShowPlan((current) => !current)}
            />
            <ActionButton
              label={copy.archivePlan}
              disabled={Boolean(validationError)}
              onPress={handleArchiveCurrentPlan}
            />
            <ActionButton
              label={copy.exportPlanAsPdf}
              disabled={Boolean(validationError)}
              onPress={handleExportPlanAsPdf}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.archiveSectionTitle}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{copy.archiveNameLabel}</Text>
            <TextInput
              value={archiveName}
              onChangeText={setArchiveName}
              placeholder={copy.archiveNamePlaceholder}
              placeholderTextColor="#64748b"
              style={styles.textInput}
            />
          </View>
          {archivedPlans.length > 0 ? (
            <View style={styles.archiveList}>
              {archivedPlans.map((planItem) => (
                <View key={planItem.id} style={styles.archiveItem}>
                  <TextInput
                    value={archivedPlanDraftNames[planItem.id] ?? planItem.name}
                    onChangeText={(nextName) =>
                      setArchivedPlanDraftNames((currentDraftNames) => ({
                        ...currentDraftNames,
                        [planItem.id]: nextName,
                      }))
                    }
                    placeholder={copy.archiveNamePlaceholder}
                    placeholderTextColor="#64748b"
                    style={styles.textInput}
                  />
                  <Text style={styles.hint}>{copy.archivedOn(archiveDateFormatter.format(new Date(planItem.createdAt)))}</Text>
                  <View style={styles.archiveActions}>
                    <ActionButton
                      label={copy.saveArchivedPlanChanges}
                      variant="muted"
                      disabled={Boolean(validationError)}
                      onPress={() => handleSaveCurrentChangesToArchivedPlan(planItem)}
                    />
                    <ActionButton label={copy.selectArchivedPlan} variant="muted" onPress={() => handleRestoreArchivedPlan(planItem)} />
                    <ActionButton label={copy.deleteArchivedPlan} variant="danger" onPress={() => handleDeleteArchivedPlan(planItem)} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{copy.noArchivedPlans}</Text>
          )}
          {archiveFeedback ? <Text style={styles.feedbackText}>{archiveFeedback}</Text> : null}
          {storageFeedback ? <Text style={styles.errorText}>{storageFeedback}</Text> : null}
        </View>

        {showPlan && !validationError ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{copy.showPlan}</Text>
            <View style={styles.installmentList}>
              {plan.installments.map((installment) => (
                <View key={installment.month} style={styles.installmentItem}>
                  <Text style={styles.installmentTitle}>{copy.monthWithNumber(installment.month)}</Text>
                  <View style={styles.planGrid}>
                    <PlanValue label={copy.payment} value={euroFormatter.format(installment.payment)} />
                    <PlanValue label={copy.principal} value={euroFormatter.format(installment.principal)} />
                    <PlanValue label={copy.interest} value={euroFormatter.format(installment.interest)} />
                    <PlanValue label={copy.bankCost} value={euroFormatter.format(installment.bankCost)} />
                    <PlanValue label={copy.additionalPayment} value={euroFormatter.format(installment.additionalPayment)} />
                    <PlanValue label={copy.remainingCapital} value={euroFormatter.format(installment.remainingPrincipal)} />
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.totalsCard}>
              <Text style={styles.sectionTitle}>{copy.planTotals}</Text>
              <View style={styles.planGrid}>
                <PlanValue label={copy.capitalPaid} value={euroFormatter.format(plan.totalCapitalPaid)} />
                <PlanValue label={copy.interestPaid} value={euroFormatter.format(plan.totalInterest)} />
                <PlanValue label={copy.totalAdditionalPayments} value={euroFormatter.format(plan.totalAdditionalPayments)} />
                <PlanValue label={copy.capitalPlusInterest} value={euroFormatter.format(plan.totalCapitalAndInterest)} />
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    gap: 18,
    padding: 18,
    paddingBottom: 36,
  },
  header: {
    gap: 8,
  },
  title: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: 16,
    borderColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center',
  },
  textInput: {
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stepButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    minHeight: 44,
    backgroundColor: '#020617',
  },
  stepButtonText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  segmentedControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    flexGrow: 1,
    alignItems: 'center',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  segmentSelected: {
    borderColor: '#34d399',
    backgroundColor: '#064e3b',
  },
  segmentText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: '#d1fae5',
  },
  summaryGrid: {
    gap: 10,
  },
  summaryTile: {
    gap: 4,
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  chartCard: {
    gap: 12,
    borderColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  yearControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yearPill: {
    flex: 1,
    alignItems: 'center',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
  },
  yearPillText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  chartBarGroup: {
    gap: 6,
  },
  chartBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartBarLabel: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
  },
  chartBarValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  chartTrack: {
    overflow: 'hidden',
    borderRadius: 999,
    height: 10,
    backgroundColor: '#1e293b',
  },
  chartFill: {
    height: 10,
    borderRadius: 999,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#22d3ee',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    borderColor: '#34d399',
    backgroundColor: '#34d399',
  },
  dangerButton: {
    borderColor: '#fb7185',
  },
  mutedButton: {
    borderColor: '#334155',
  },
  actionButtonText: {
    color: '#a5f3fc',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#022c22',
  },
  dangerButtonText: {
    color: '#fecdd3',
  },
  mutedButtonText: {
    color: '#cbd5e1',
  },
  archiveList: {
    gap: 12,
  },
  archiveItem: {
    gap: 10,
    borderColor: '#334155',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  archiveActions: {
    gap: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackText: {
    color: '#67e8f9',
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  errorBanner: {
    borderColor: '#fb7185',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#4c0519',
    color: '#fecdd3',
    padding: 10,
  },
  installmentList: {
    gap: 12,
  },
  installmentItem: {
    gap: 10,
    borderColor: '#334155',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  installmentTitle: {
    color: '#6ee7b7',
    fontSize: 15,
    fontWeight: '700',
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  planValue: {
    minWidth: '45%',
    flexGrow: 1,
    gap: 2,
  },
  planValueLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  planValueText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  totalsCard: {
    gap: 12,
    borderColor: '#047857',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#022c22',
    padding: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
})
