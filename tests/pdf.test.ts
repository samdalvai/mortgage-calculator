import { TRANSLATIONS } from '../packages/core/src/i18n/translations.js'
import { EURO_NUMBER_LOCALE, formatCurrencyForPdf } from '../packages/core/src/lib/formatting.js'
import { calculateMortgagePlan } from '../packages/core/src/lib/mortgage.js'
import { createMortgagePlanPdfDocument, createPdfDocumentFromLines } from '../packages/core/src/lib/pdf.js'
import { assert, assertEqual } from './assert.js'

const formatter = new Intl.NumberFormat(EURO_NUMBER_LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

/** Checks the cross-reference table, startxref pointer and stream lengths of a generated PDF. */
function assertValidPdfStructure(pdf: string, label: string) {
  assert(pdf.startsWith('%PDF-1.4\n'), `${label}: header`)
  assert(pdf.endsWith('%%EOF'), `${label}: trailer end`)
  assert(/^[\x09\x0a\x0d\x20-\x7e]*$/.test(pdf), `${label}: only ASCII characters`)

  const startXref = Number(pdf.match(/startxref\n(\d+)\n%%EOF$/)?.[1])
  assert(pdf.startsWith('xref\n', startXref), `${label}: startxref points at the xref table`)

  const xrefHeader = pdf.slice(startXref).match(/^xref\n0 (\d+)\n/)
  assert(xrefHeader !== null, `${label}: xref header`)
  const entryCount = Number(xrefHeader?.[1])
  const entries = pdf.slice(startXref + (xrefHeader?.[0].length ?? 0)).split('\n').slice(0, entryCount)

  assertEqual(entries[0], '0000000000 65535 f ', `${label}: free entry`)
  for (let objectId = 1; objectId < entryCount; objectId += 1) {
    const offset = Number(entries[objectId].slice(0, 10))
    assert(pdf.startsWith(`${objectId} 0 obj\n`, offset), `${label}: xref offset of object ${objectId}`)
  }
  assert(pdf.includes(`/Size ${entryCount} `), `${label}: trailer size`)

  for (const match of pdf.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) {
    assertEqual(match[2].length, Number(match[1]), `${label}: stream length`)
  }
}

function getPageCount(pdf: string) {
  return Number(pdf.match(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count (\d+)/)?.[1])
}

function testEscapesTextAndReplacesNonAscii() {
  const pdf = createPdfDocumentFromLines(['Total (EUR) \\ 100', 'Prêt €'])

  assertValidPdfStructure(pdf, 'escaping')
  assert(pdf.includes('(Total \\(EUR\\) \\\\ 100) Tj'), 'parentheses and backslashes are escaped')
  assert(pdf.includes('(Pr?t ?) Tj'), 'non-ASCII characters are replaced')
  assertEqual(getPageCount(pdf), 1, 'short document fits one page')
}

function testCurrencyFormattingForPdf() {
  assertEqual(formatCurrencyForPdf(formatter, 1234.5), '1.234,50 EUR', 'euro sign and non-breaking space replaced')
}

function testMortgagePlanPdf() {
  const plan = calculateMortgagePlan({
    houseCost: 250000,
    downPayment: 50000,
    years: 25,
    annualInterestRate: 0.03,
    monthlyBankCost: 2,
  })
  const copy = TRANSLATIONS.en
  const pdf = createMortgagePlanPdfDocument({
    copy,
    formatter,
    houseCost: 250000,
    downPayment: 50000,
    years: 25,
    annualInterestRate: 3,
    monthlyBankCost: 2,
    additionalAnnualPayment: 0,
    additionalPaymentStrategyLabel: copy.shortenDurationStrategy,
    monthlyPayment: plan.monthlyPayment,
    totalCapitalPaid: plan.totalCapitalPaid,
    totalInterest: plan.totalInterest,
    totalAdditionalPayments: plan.totalAdditionalPayments,
    interestSaved: 0,
    durationSavedLabel: '0y 0m',
    totalCapitalAndInterest: plan.totalCapitalAndInterest,
    totalPaid: plan.totalPaid,
    totalBankCosts: plan.totalBankCosts,
    installments: plan.installments,
  })

  assertValidPdfStructure(pdf, 'mortgage plan')
  assert(pdf.includes(`(${copy.pdfTitle}) Tj`), 'title line')
  assert(pdf.includes('3,00%'), 'interest rate uses a decimal comma')
  assert(pdf.includes('250.000,00 EUR'), 'amounts use EUR instead of the euro sign')
  assert(getPageCount(pdf) > 1, '300 installments span several pages')

  const installmentRows = pdf.match(/\((\d+) +\|/g) ?? []
  assertEqual(installmentRows.length, plan.installments.length, 'one table row per installment')
}

testEscapesTextAndReplacesNonAscii()
testCurrencyFormattingForPdf()
testMortgagePlanPdf()
