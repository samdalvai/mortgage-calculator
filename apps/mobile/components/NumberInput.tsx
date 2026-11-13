import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { EURO_NUMBER_LOCALE, parseLocalizedNumber, type Translation } from '../../../packages/core/src'

type NumberInputProps = {
  copy: Pick<Translation, 'decreaseValue' | 'increaseValue'>
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

export function NumberInput({
  copy,
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

  const parseDraft = (rawValue: string) => parseLocalizedNumber(rawValue, resolvedFractionDigits)

  const commitValue = (rawValue: string) => {
    if (rawValue === '') {
      onValueChange(clampValue(0, min, max))
      return
    }

    const parsedValue = parseDraft(rawValue)
    if (Number.isNaN(parsedValue)) {
      return
    }

    onValueChange(clampValue(roundToDigits(parsedValue, resolvedFractionDigits), min, max))
  }

  const handleStepChange = (direction: 'increase' | 'decrease') => {
    const increment = step ?? 1
    const parsedDraftValue = parseDraft(draftValue)
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
          accessibilityLabel={copy.decreaseValue(label)}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
          onPress={() => handleStepChange('decrease')}
        >
          <Text style={styles.stepButtonText}>-</Text>
        </Pressable>
        <TextInput
          keyboardType={resolvedFractionDigits > 0 ? 'decimal-pad' : 'number-pad'}
          value={draftValue}
          onFocus={() => {
            setIsFocused(true)
            if (parseDraft(draftValue) === 0) {
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

            const parsedValue = parseDraft(draftValue)
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
          accessibilityLabel={copy.increaseValue(label)}
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

const styles = StyleSheet.create({
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
  pressed: {
    opacity: 0.75,
  },
})
