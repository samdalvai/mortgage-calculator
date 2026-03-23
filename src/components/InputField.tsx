import { useEffect, useRef, useState, type PointerEvent } from 'react'

import { EURO_NUMBER_LOCALE } from '../lib/formatting'

export type InputFieldProps = {
  id: string
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

const LONG_PRESS_INITIAL_DELAY_MS = 400
const LONG_PRESS_REPEAT_INTERVAL_MS = 120

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

const formatEuropeanNumber = (value: number, fractionDigits: number, useGrouping: boolean): string =>
  new Intl.NumberFormat(EURO_NUMBER_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping,
  }).format(value)

export function InputField({
  id,
  label,
  value,
  min,
  max,
  step,
  hint,
  fractionDigits,
  useGrouping = false,
  onValueChange,
}: InputFieldProps) {
  const resolvedFractionDigits = fractionDigits ?? countFractionDigits(step ?? 1)
  const [draftValue, setDraftValue] = useState(formatEuropeanNumber(value, resolvedFractionDigits, useGrouping))
  const [isFocused, setIsFocused] = useState(false)
  const holdStartTimeoutRef = useRef<number | null>(null)
  const holdIntervalRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const valueRef = useRef(value)
  const draftValueRef = useRef(draftValue)

  const syncDraftValue = (nextDraftValue: string) => {
    draftValueRef.current = nextDraftValue
    setDraftValue(nextDraftValue)
  }

  const syncValue = (nextValue: number) => {
    valueRef.current = nextValue
    onValueChange(nextValue)
  }

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!isFocused) {
      const formattedValue = formatEuropeanNumber(value, resolvedFractionDigits, useGrouping)
      draftValueRef.current = formattedValue
      setDraftValue(formattedValue)
    }
  }, [isFocused, resolvedFractionDigits, useGrouping, value])

  useEffect(() => {
    return () => {
      if (holdStartTimeoutRef.current !== null) {
        window.clearTimeout(holdStartTimeoutRef.current)
      }

      if (holdIntervalRef.current !== null) {
        window.clearInterval(holdIntervalRef.current)
      }
    }
  }, [])

  const commitValue = (rawValue: string) => {
    if (rawValue === '') {
      syncValue(0)
      return
    }

    const parsedValue = parseEuropeanNumber(rawValue)

    if (Number.isNaN(parsedValue)) {
      return
    }

    const roundedValue = roundToDigits(parsedValue, resolvedFractionDigits)
    const clampedValue = Math.max(min ?? Number.NEGATIVE_INFINITY, Math.min(max ?? Number.POSITIVE_INFINITY, roundedValue))
    syncValue(clampedValue)
  }

  const handleStepChange = (direction: 'increase' | 'decrease') => {
    const increment = step ?? 1
    const parsedDraftValue = parseEuropeanNumber(draftValueRef.current)
    const baseValue = Number.isNaN(parsedDraftValue) ? valueRef.current : parsedDraftValue
    const nextValue = direction === 'increase' ? baseValue + increment : baseValue - increment
    const roundedValue = roundToDigits(nextValue, resolvedFractionDigits)
    const clampedValue = Math.max(min ?? Number.NEGATIVE_INFINITY, Math.min(max ?? Number.POSITIVE_INFINITY, roundedValue))
    syncValue(clampedValue)
    syncDraftValue(formatEuropeanNumber(clampedValue, resolvedFractionDigits, useGrouping))
  }

  const stopContinuousStepChange = () => {
    if (holdStartTimeoutRef.current !== null) {
      window.clearTimeout(holdStartTimeoutRef.current)
      holdStartTimeoutRef.current = null
    }

    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  const startContinuousStepChange = (direction: 'increase' | 'decrease') => {
    stopContinuousStepChange()
    longPressTriggeredRef.current = false
    holdStartTimeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true
      handleStepChange(direction)
      holdIntervalRef.current = window.setInterval(() => {
        handleStepChange(direction)
      }, LONG_PRESS_REPEAT_INTERVAL_MS)
    }, LONG_PRESS_INITIAL_DELAY_MS)
  }

  const handlePressStart = (direction: 'increase' | 'decrease') => {
    startContinuousStepChange(direction)
  }

  const handlePressEnd = (direction: 'increase' | 'decrease') => {
    const shouldApplySingleStep = !longPressTriggeredRef.current
    stopContinuousStepChange()
    longPressTriggeredRef.current = false

    if (shouldApplySingleStep) {
      handleStepChange(direction)
    }
  }

  const createPointerDownHandler = (direction: 'increase' | 'decrease') => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    if (activePointerIdRef.current !== null) {
      return
    }

    event.preventDefault()
    activePointerIdRef.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    handlePressStart(direction)
  }

  const createPointerUpHandler = (direction: 'increase' | 'decrease') => (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    activePointerIdRef.current = null
    handlePressEnd(direction)
  }

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    activePointerIdRef.current = null
    stopContinuousStepChange()
    longPressTriggeredRef.current = false
  }

  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onPointerDown={createPointerDownHandler('decrease')}
          onPointerUp={createPointerUpHandler('decrease')}
          onPointerCancel={handlePointerCancel}
          className="touch-manipulation rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-lg font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-center text-slate-100 outline-none ring-emerald-400 focus:ring"
          value={draftValue}
          onFocus={() => {
            setIsFocused(true)
            if (parseEuropeanNumber(draftValue) === 0) {
              syncDraftValue('')
            }
          }}
          onBlur={() => {
            setIsFocused(false)
            if (draftValue === '') {
              syncDraftValue(formatEuropeanNumber(0, resolvedFractionDigits, useGrouping))
              return
            }

            const parsedValue = parseEuropeanNumber(draftValue)
            if (Number.isNaN(parsedValue)) {
              syncDraftValue(formatEuropeanNumber(value, resolvedFractionDigits, useGrouping))
              return
            }

            const roundedValue = roundToDigits(parsedValue, resolvedFractionDigits)
            const clampedValue = Math.max(min ?? Number.NEGATIVE_INFINITY, Math.min(max ?? Number.POSITIVE_INFINITY, roundedValue))
            syncValue(clampedValue)
            syncDraftValue(formatEuropeanNumber(clampedValue, resolvedFractionDigits, useGrouping))
          }}
          onChange={(event) => {
            const rawInput = event.target.value
            syncDraftValue(rawInput)
            commitValue(rawInput)
          }}
        />
        <button
          type="button"
          onPointerDown={createPointerDownHandler('increase')}
          onPointerUp={createPointerUpHandler('increase')}
          onPointerCancel={handlePointerCancel}
          className="touch-manipulation rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-lg font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  )
}
