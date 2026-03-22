import type { Translation } from '../i18n/translations'

import { formatCurrencyForPdf } from './formatting'

const PDF_PAGE_WIDTH = 595
const PDF_PAGE_HEIGHT = 842
const PDF_HORIZONTAL_MARGIN = 28
const PDF_TOP_MARGIN = 34
const PDF_BOTTOM_MARGIN = 32
const PDF_MAX_FONT_SIZE = 10
const PDF_MIN_FONT_SIZE = 5
const PDF_CHARACTER_WIDTH_RATIO = 0.6

const PDF_COLUMN_WIDTHS = {
  month: 6,
  payment: 12,
  principal: 12,
  interest: 12,
  bankCost: 10,
  additionalPayment: 12,
  remaining: 14,
} as const

type PdfInstallment = {
  month: number
  payment: number
  principal: number
  interest: number
  bankCost: number
  additionalPayment: number
  remainingPrincipal: number
}

type DownloadMortgagePlanPdfParams = {
  copy: Translation
  formatter: Intl.NumberFormat
  houseCost: number
  downPayment: number
  years: number
  annualInterestRate: number
  monthlyBankCost: number
  additionalAnnualPayment: number
  additionalPaymentStrategyLabel: string
  monthlyPayment: number
  totalCapitalPaid: number
  totalInterest: number
  totalAdditionalPayments: number
  interestSaved: number
  durationSavedLabel: string
  totalCapitalAndInterest: number
  totalPaid: number
  totalBankCosts: number
  installments: PdfInstallment[]
}

const toPdfSafeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7e]/g, '?')

const padPdfCell = (value: string, width: number, align: 'left' | 'right' = 'right') => {
  if (value.length >= width) {
    return value.slice(0, width)
  }

  return align === 'left' ? value.padEnd(width, ' ') : value.padStart(width, ' ')
}

const createPdfTableLine = (
  month: string,
  payment: string,
  principal: string,
  interest: string,
  bankCost: string,
  additionalPayment: string,
  remainingCapital: string,
) =>
  [
    padPdfCell(month, PDF_COLUMN_WIDTHS.month, 'left'),
    padPdfCell(payment, PDF_COLUMN_WIDTHS.payment),
    padPdfCell(principal, PDF_COLUMN_WIDTHS.principal),
    padPdfCell(interest, PDF_COLUMN_WIDTHS.interest),
    padPdfCell(bankCost, PDF_COLUMN_WIDTHS.bankCost),
    padPdfCell(additionalPayment, PDF_COLUMN_WIDTHS.additionalPayment),
    padPdfCell(remainingCapital, PDF_COLUMN_WIDTHS.remaining),
  ].join(' | ')

const createPdfDocumentFromLines = (lines: string[]) => {
  const longestLineLength = lines.reduce((longest, line) => Math.max(longest, line.length), 0)
  const availableWidth = PDF_PAGE_WIDTH - PDF_HORIZONTAL_MARGIN * 2
  const computedFontSize =
    longestLineLength > 0 ? availableWidth / (longestLineLength * PDF_CHARACTER_WIDTH_RATIO) : PDF_MAX_FONT_SIZE
  const fontSize = Math.max(PDF_MIN_FONT_SIZE, Math.min(PDF_MAX_FONT_SIZE, Number(computedFontSize.toFixed(2))))
  const lineHeight = Number(Math.max(fontSize * 1.35, fontSize + 2).toFixed(2))
  const pageLineLimit = Math.max(1, Math.floor((PDF_PAGE_HEIGHT - PDF_TOP_MARGIN - PDF_BOTTOM_MARGIN) / lineHeight))
  const textStartY = PDF_PAGE_HEIGHT - PDF_TOP_MARGIN
  const pages: string[][] = []

  for (let index = 0; index < lines.length; index += pageLineLimit) {
    pages.push(lines.slice(index, index + pageLineLimit))
  }

  const objects: Record<number, string> = {}
  const fontObjectId = 3
  const firstPageObjectId = 4

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pages.map((_, pageIndex) => `${firstPageObjectId + pageIndex * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[fontObjectId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectId = firstPageObjectId + pageIndex * 2
    const contentObjectId = pageObjectId + 1

    const textOperations = pageLines.map((line) => `(${toPdfSafeText(line)}) Tj T*`).join('\n')
    const stream = `BT
/F1 ${fontSize} Tf
${PDF_HORIZONTAL_MARGIN} ${textStartY} Td
${lineHeight} TL
${textOperations}
ET`

    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    objects[contentObjectId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })

  const orderedObjectIds = Object.keys(objects)
    .map(Number)
    .sort((first, second) => first - second)

  let documentContent = '%PDF-1.4\n'
  const offsets: number[] = [0]

  orderedObjectIds.forEach((objectId) => {
    offsets[objectId] = documentContent.length
    documentContent += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`
  })

  const xrefStart = documentContent.length
  documentContent += `xref\n0 ${orderedObjectIds.length + 1}\n`
  documentContent += '0000000000 65535 f \n'
  orderedObjectIds.forEach((objectId) => {
    documentContent += `${offsets[objectId].toString().padStart(10, '0')} 00000 n \n`
  })
  documentContent += `trailer\n<< /Size ${orderedObjectIds.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([documentContent], { type: 'application/pdf' })
}

export const downloadMortgagePlanPdf = ({
  copy,
  formatter,
  houseCost,
  downPayment,
  years,
  annualInterestRate,
  monthlyBankCost,
  additionalAnnualPayment,
  additionalPaymentStrategyLabel,
  monthlyPayment,
  totalCapitalPaid,
  totalInterest,
  totalAdditionalPayments,
  interestSaved,
  durationSavedLabel,
  totalCapitalAndInterest,
  totalPaid,
  totalBankCosts,
  installments,
}: DownloadMortgagePlanPdfParams) => {
  const tableHeaderLine = createPdfTableLine(
    copy.pdfMonthHeader,
    copy.pdfPaymentHeader,
    copy.pdfPrincipalHeader,
    copy.pdfInterestHeader,
    copy.pdfBankCostHeader,
    copy.pdfAdditionalPaymentHeader,
    copy.pdfRemainingCapitalHeader,
  )
  const tableSeparatorLine = '-'.repeat(tableHeaderLine.length)

  const lines = [
    copy.pdfTitle,
    copy.pdfGeneratedBy,
    '',
    `${copy.pdfHouseCost}: ${formatCurrencyForPdf(formatter, houseCost)}`,
    `${copy.pdfDownPayment}: ${formatCurrencyForPdf(formatter, downPayment)}`,
    `${copy.pdfDuration}: ${years} ${copy.pdfYears}`,
    `${copy.pdfAnnualInterestRate}: ${annualInterestRate.toFixed(2).replace('.', ',')}%`,
    `${copy.pdfMonthlyBankCost}: ${formatCurrencyForPdf(formatter, monthlyBankCost)}`,
    `${copy.pdfAdditionalAnnualPayment}: ${formatCurrencyForPdf(formatter, additionalAnnualPayment)}`,
    `${copy.pdfAdditionalPaymentStrategy}: ${additionalPaymentStrategyLabel}`,
    `${copy.pdfMonthlyPayment}: ${formatCurrencyForPdf(formatter, monthlyPayment)}`,
    `${copy.pdfTotalCapitalPaid}: ${formatCurrencyForPdf(formatter, totalCapitalPaid)}`,
    `${copy.pdfTotalInterestPaid}: ${formatCurrencyForPdf(formatter, totalInterest)}`,
    `${copy.pdfTotalAdditionalPayments}: ${formatCurrencyForPdf(formatter, totalAdditionalPayments)}`,
    `${copy.pdfInterestSaved}: ${formatCurrencyForPdf(formatter, interestSaved)}`,
    `${copy.pdfDurationSaved}: ${durationSavedLabel}`,
    `${copy.pdfTotalCapitalAndInterest}: ${formatCurrencyForPdf(formatter, totalCapitalAndInterest)}`,
    `${copy.pdfTotalPaid}: ${formatCurrencyForPdf(formatter, totalPaid)}`,
    '',
    tableHeaderLine,
    tableSeparatorLine,
    ...installments.map((installment) =>
      createPdfTableLine(
        installment.month.toString(),
        formatCurrencyForPdf(formatter, installment.payment),
        formatCurrencyForPdf(formatter, installment.principal),
        formatCurrencyForPdf(formatter, installment.interest),
        formatCurrencyForPdf(formatter, installment.bankCost),
        formatCurrencyForPdf(formatter, installment.additionalPayment),
        formatCurrencyForPdf(formatter, installment.remainingPrincipal),
      ),
    ),
    tableSeparatorLine,
    createPdfTableLine(
      copy.pdfTotalRow,
      formatCurrencyForPdf(formatter, totalPaid),
      formatCurrencyForPdf(formatter, totalCapitalPaid),
      formatCurrencyForPdf(formatter, totalInterest),
      formatCurrencyForPdf(formatter, totalBankCosts),
      formatCurrencyForPdf(formatter, totalAdditionalPayments),
      formatCurrencyForPdf(formatter, 0),
    ),
  ]

  const pdfBlob = createPdfDocumentFromLines(lines)
  const pdfDownloadUrl = URL.createObjectURL(pdfBlob)
  const linkElement = document.createElement('a')
  linkElement.href = pdfDownloadUrl
  linkElement.download = `mortgage-plan-${new Date().toISOString().slice(0, 10)}.pdf`
  linkElement.click()
  URL.revokeObjectURL(pdfDownloadUrl)
}
