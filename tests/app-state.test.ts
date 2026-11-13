import {
  MAX_ARCHIVED_PLANS,
  MAX_MORTGAGE_YEARS,
  clampMortgageYears,
  buildChartData,
  createDefaultInputs,
  getMaxChartAmount,
  getValidationErrorKind,
  parseArchivedPlans,
  parsePersistedInputs,
} from '../packages/core/src/lib/app-state.js'
import { calculateMortgagePlan } from '../packages/core/src/lib/mortgage.js'
import { assert, assertDeepEqual, assertEqual } from './assert.js'

const fallback = createDefaultInputs('it')

const validPlanInputs = {
  houseCost: 300000,
  downPayment: 60000,
  years: 20,
  annualInterestRate: 2.5,
  monthlyBankCost: 3,
  additionalAnnualPayment: 1000,
  additionalPaymentStrategy: 'reduce-payment',
}

function testParsePersistedInputsFallbacks() {
  assertDeepEqual(parsePersistedInputs(null, fallback), fallback, 'null input')
  assertDeepEqual(parsePersistedInputs('', fallback), fallback, 'empty input')
  assertDeepEqual(parsePersistedInputs('{not json', fallback), fallback, 'invalid JSON')
  assertDeepEqual(parsePersistedInputs('{}', fallback), fallback, 'empty object')
}

function testParsePersistedInputsKeepsValidFields() {
  const stored = JSON.stringify({ ...validPlanInputs, language: 'de' })
  assertDeepEqual(parsePersistedInputs(stored, fallback), { language: 'de', ...validPlanInputs }, 'all valid fields')
}

function testParsePersistedInputsReplacesInvalidFields() {
  const stored = JSON.stringify({
    language: 'es',
    houseCost: '300000',
    downPayment: null,
    years: 30,
    additionalPaymentStrategy: 'pay-everything',
  })
  const parsed = parsePersistedInputs(stored, fallback)

  assertEqual(parsed.language, 'it', 'unsupported language falls back')
  assertEqual(parsed.houseCost, fallback.houseCost, 'string number falls back')
  assertEqual(parsed.downPayment, fallback.downPayment, 'null falls back')
  assertEqual(parsed.years, 30, 'valid field kept next to invalid ones')
  assertEqual(parsed.additionalPaymentStrategy, fallback.additionalPaymentStrategy, 'unknown strategy falls back')
}

function testParseArchivedPlans() {
  assertDeepEqual(parseArchivedPlans(null, fallback), [], 'null input')
  assertDeepEqual(parseArchivedPlans('{broken', fallback), [], 'invalid JSON')
  assertDeepEqual(parseArchivedPlans('{"id":"1"}', fallback), [], 'not an array')

  const stored = JSON.stringify([
    { id: 'a', name: 'Family home', createdAt: '2026-01-01T10:00:00.000Z', inputs: { ...validPlanInputs, language: 'de' } },
    { id: 'b', name: 'Missing date', inputs: validPlanInputs },
    { id: 3, name: 'Numeric id', createdAt: '2026-01-01T10:00:00.000Z', inputs: validPlanInputs },
    { id: 'c', name: 'No inputs', createdAt: '2026-01-01T10:00:00.000Z' },
    null,
    'plan',
    { id: 'd', name: 'Partial', createdAt: '2026-02-01T10:00:00.000Z', inputs: { houseCost: 180000 } },
  ])
  const plans = parseArchivedPlans(stored, fallback)

  assertDeepEqual(
    plans.map((plan) => plan.id),
    ['a', 'd'],
    'invalid entries are dropped',
  )
  assertDeepEqual(plans[0].inputs, validPlanInputs, 'language is not stored with archived inputs')
  assertEqual(plans[1].inputs.houseCost, 180000, 'partial inputs keep valid values')
  assertEqual(plans[1].inputs.years, fallback.years, 'partial inputs fill missing values from fallback')
}

function testParseArchivedPlansLimit() {
  const stored = JSON.stringify(
    Array.from({ length: MAX_ARCHIVED_PLANS + 5 }, (_, index) => ({
      id: `plan-${index}`,
      name: `Plan ${index}`,
      createdAt: '2026-01-01T10:00:00.000Z',
      inputs: validPlanInputs,
    })),
  )
  const plans = parseArchivedPlans(stored, fallback)

  assertEqual(plans.length, MAX_ARCHIVED_PLANS, 'archive is capped')
  assertEqual(plans[0].id, 'plan-0', 'newest plans (first entries) are kept')
}

function testValidationErrorKind() {
  assertEqual(
    getValidationErrorKind({ houseCost: 200000, downPayment: 250000, additionalAnnualPayment: 0 }),
    'down-payment-exceeds-house-cost',
    'down payment above house cost',
  )
  assertEqual(
    getValidationErrorKind({ houseCost: 200000, downPayment: 50000, additionalAnnualPayment: 150001 }),
    'additional-payment-exceeds-loan',
    'additional payment above principal',
  )
  assertEqual(
    getValidationErrorKind({ houseCost: 200000, downPayment: 50000, additionalAnnualPayment: 150000 }),
    null,
    'additional payment equal to principal is allowed',
  )
  assertEqual(
    getValidationErrorKind({ houseCost: 200000, downPayment: 200000, additionalAnnualPayment: 0 }),
    null,
    'down payment equal to house cost is allowed',
  )
}

function testBuildChartData() {
  const plan = calculateMortgagePlan({
    houseCost: 200000,
    downPayment: 50000,
    years: 10,
    annualInterestRate: 0.03,
    monthlyBankCost: 0,
  })
  const chartData = buildChartData(plan)
  const lastPoint = chartData[chartData.length - 1]

  assertEqual(chartData.length, 11, 'one point per year plus year 0')
  assertDeepEqual(
    chartData[0],
    { year: 0, remainingCapital: 150000, reimbursedCapital: 0, paidInterest: 0 },
    'year 0 starts at the full principal',
  )
  assertEqual(lastPoint.year, 10, 'last year')
  assertEqual(lastPoint.remainingCapital, 0, 'loan fully repaid')
  assert(Math.abs(lastPoint.reimbursedCapital - plan.totalCapitalPaid) < 0.01, 'reimbursed capital matches plan total')
  assert(Math.abs(lastPoint.paidInterest - plan.totalInterest) < 0.01, 'paid interest matches plan total')

  for (let index = 1; index < chartData.length; index += 1) {
    assert(chartData[index].remainingCapital <= chartData[index - 1].remainingCapital, `remaining capital never grows (year ${index})`)
  }

  assertEqual(getMaxChartAmount(chartData), 150000, 'max chart amount is the starting principal')
  assertEqual(getMaxChartAmount([]), 0, 'max chart amount of empty data')
}

function testBuildChartDataWithPartialLastYear() {
  const plan = calculateMortgagePlan({
    houseCost: 250000,
    downPayment: 50000,
    years: 25,
    annualInterestRate: 0.03,
    monthlyBankCost: 0,
    additionalAnnualPayment: 5000,
  })
  const chartData = buildChartData(plan)

  assertEqual(chartData.length, Math.ceil(plan.installments.length / 12) + 1, 'partial final year still gets a point')
  assertEqual(chartData[chartData.length - 1].remainingCapital, 0, 'shortened loan ends at zero')
}

function testMortgageDurationLimit() {
  assertEqual(clampMortgageYears(25), 25, 'normal duration unchanged')
  assertEqual(clampMortgageYears(2500), MAX_MORTGAGE_YEARS, 'long duration capped')
  assertEqual(clampMortgageYears(0), 1, 'zero raised to one year')
  assertEqual(clampMortgageYears(-5), 1, 'negative raised to one year')
  assertEqual(clampMortgageYears(12.6), 13, 'fractional years rounded')

  assertEqual(parsePersistedInputs(JSON.stringify({ years: 2500 }), fallback).years, MAX_MORTGAGE_YEARS, 'saved inputs capped')
  const plans = parseArchivedPlans(
    JSON.stringify([{ id: 'x', name: 'Huge', createdAt: '2026-01-01T10:00:00.000Z', inputs: { years: 9999 } }]),
    fallback,
  )
  assertEqual(plans[0].inputs.years, MAX_MORTGAGE_YEARS, 'archived plan capped')

  const longestPlan = calculateMortgagePlan({
    houseCost: 250000,
    downPayment: 50000,
    years: MAX_MORTGAGE_YEARS,
    annualInterestRate: 0.03,
    monthlyBankCost: 0,
  })
  assertEqual(longestPlan.installments.length, MAX_MORTGAGE_YEARS * 12, 'longest plan has 600 rows')
}

testMortgageDurationLimit()
testParsePersistedInputsFallbacks()
testParsePersistedInputsKeepsValidFields()
testParsePersistedInputsReplacesInvalidFields()
testParseArchivedPlans()
testParseArchivedPlansLimit()
testValidationErrorKind()
testBuildChartData()
testBuildChartDataWithPartialLastYear()
