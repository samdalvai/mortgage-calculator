import { useMemo, useState } from 'react'
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native'

import { calculateMortgagePlan, EURO_NUMBER_LOCALE, formatDurationLabel } from '../../packages/core/src'

type NumericInputProps = {
  label: string
  value: number
  suffix?: string
  onChange: (value: number) => void
}

const parseNumber = (rawValue: string) => {
  const parsed = Number(rawValue.replace(/\s/g, '').replace(',', '.'))
  return Number.isNaN(parsed) ? 0 : parsed
}

function NumericInput({ label, value, suffix, onChange }: NumericInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          keyboardType="decimal-pad"
          value={String(value)}
          onChangeText={(nextValue) => onChange(parseNumber(nextValue))}
          style={styles.input}
          placeholderTextColor="#64748b"
        />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  )
}

export default function App() {
  const [houseCost, setHouseCost] = useState(250000)
  const [downPayment, setDownPayment] = useState(50000)
  const [years, setYears] = useState(25)
  const [annualInterestRate, setAnnualInterestRate] = useState(3)
  const [monthlyBankCost, setMonthlyBankCost] = useState(0)

  const plan = useMemo(
    () =>
      calculateMortgagePlan({
        houseCost,
        downPayment,
        years,
        annualInterestRate: annualInterestRate / 100,
        monthlyBankCost,
        additionalAnnualPayment: 0,
        additionalPaymentStrategy: 'shorten-duration',
      }),
    [annualInterestRate, downPayment, houseCost, monthlyBankCost, years],
  )

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(EURO_NUMBER_LOCALE, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
    [],
  )

  const loanPrincipal = Math.max(houseCost - downPayment, 0)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mortgage Calculator</Text>
        <Text style={styles.subtitle}>A native mobile shell powered by the shared mortgage calculation package.</Text>

        <View style={styles.card}>
          <NumericInput label="House cost" value={houseCost} suffix="€" onChange={setHouseCost} />
          <NumericInput label="Down payment" value={downPayment} suffix="€" onChange={setDownPayment} />
          <NumericInput label="Duration" value={years} suffix="years" onChange={setYears} />
          <NumericInput label="Annual interest rate" value={annualInterestRate} suffix="%" onChange={setAnnualInterestRate} />
          <NumericInput label="Monthly bank cost" value={monthlyBankCost} suffix="€" onChange={setMonthlyBankCost} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan principal</Text>
            <Text style={styles.summaryValue}>{currencyFormatter.format(loanPrincipal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly payment</Text>
            <Text style={styles.summaryValue}>{currencyFormatter.format(plan.monthlyPayment)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total interest</Text>
            <Text style={styles.summaryValue}>{currencyFormatter.format(plan.totalInterest)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total paid</Text>
            <Text style={styles.summaryValue}>{currencyFormatter.format(plan.totalPaid)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Calculated duration</Text>
            <Text style={styles.summaryValue}>{formatDurationLabel(plan.durationMonths)}</Text>
          </View>
        </View>
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
    gap: 20,
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: 16,
    borderColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#0f172a',
    padding: 18,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 20,
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
    gap: 10,
  },
  input: {
    flex: 1,
    borderColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputSuffix: {
    minWidth: 48,
    color: '#94a3b8',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 15,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
})
