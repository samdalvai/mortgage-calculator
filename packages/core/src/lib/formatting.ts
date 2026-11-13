export const EURO_NUMBER_LOCALE = 'de-DE'

export const formatCurrencyForPdf = (formatter: Intl.NumberFormat, amount: number) =>
  formatter.format(amount).replace('€', 'EUR').replace(/\u00a0/g, ' ')

export const formatDurationLabel = (months: number) => `${Math.floor(months / 12)}y ${months % 12}m`

/**
 * Parses a number typed with either European ("1.234,56") or dot-decimal ("1234.56") notation.
 *
 * Mobile numeric keypads often only offer "." as a separator, so a single dot is read as the
 * decimal separator when the field accepts decimals (`fractionDigits > 0`). In integer fields,
 * and when several dots appear, dots are treated as thousands separators.
 */
export const parseLocalizedNumber = (rawValue: string, fractionDigits = 0): number => {
  const compact = rawValue.replace(/[\s  ']/g, '')
  if (compact === '') {
    return Number.NaN
  }

  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')

  let decimalSeparator: ',' | '.' | null = null
  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparator = lastComma > lastDot ? ',' : '.'
  } else if (lastComma !== -1) {
    decimalSeparator = ','
  } else if (lastDot !== -1) {
    const isSingleDot = compact.indexOf('.') === lastDot
    decimalSeparator = isSingleDot && fractionDigits > 0 ? '.' : null
  }

  const groupingSeparator = decimalSeparator === ',' ? '.' : ','
  const withoutGrouping = compact.split(groupingSeparator).join('')
  const normalized =
    decimalSeparator === null ? withoutGrouping.split('.').join('') : withoutGrouping.replace(decimalSeparator, '.')

  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return Number.NaN
  }

  return Number(normalized)
}
