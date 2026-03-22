export const EURO_NUMBER_LOCALE = 'de-DE'

export const formatCurrencyForPdf = (formatter: Intl.NumberFormat, amount: number) =>
  formatter.format(amount).replace('€', 'EUR').replace(/\u00a0/g, ' ')

export const formatDurationLabel = (months: number) => `${Math.floor(months / 12)}y ${months % 12}m`
