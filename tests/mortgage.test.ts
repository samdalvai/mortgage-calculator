import { calculateMortgagePlan } from '../src/lib/mortgage.js'

function assertEqual(actual: number, expected: number, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function testFrenchMortgageWithInterestAndBankCost() {
  const result = calculateMortgagePlan({
    houseCost: 200_000,
    downPayment: 20_000,
    years: 30,
    annualInterestRate: 0.03,
    monthlyBankCost: 2,
  })

  assertEqual(result.principal, 180000, 'principal')
  assertEqual(result.monthlyRateWithoutBankCost, 758.89, 'monthlyRateWithoutBankCost')
  assertEqual(result.monthlyPayment, 760.89, 'monthlyPayment')
  assertEqual(result.installments.length, 360, 'installments length')

  const first = result.installments[0]
  assertEqual(first.payment, 760.89, 'first payment')
  assertEqual(first.principal, 308.89, 'first principal')
  assertEqual(first.interest, 450, 'first interest')
  assertEqual(first.remainingPrincipal, 179691.11, 'first remaining principal')

  const lastInstallment = result.installments[result.installments.length - 1]
  assertEqual(lastInstallment.remainingPrincipal, 0, 'last remaining principal')
  assertEqual(lastInstallment.bankCost, 2, 'last bank cost')
}

function testZeroInterest() {
  const result = calculateMortgagePlan({
    houseCost: 120_000,
    downPayment: 20_000,
    years: 10,
    annualInterestRate: 0,
    monthlyBankCost: 0,
  })

  assertEqual(result.monthlyRateWithoutBankCost, 833.33, 'zero-interest monthly rate')
  assertEqual(result.totalInterest, 0, 'zero-interest totalInterest')
  assertEqual(result.installments.length, 120, 'zero-interest installments length')
  assertEqual(result.installments[0].interest, 0, 'zero-interest first installment interest')
  assertEqual(result.installments[result.installments.length - 1].remainingPrincipal, 0, 'zero-interest last remaining principal')
}

function runTests() {
  testFrenchMortgageWithInterestAndBankCost()
  testZeroInterest()
  assert(true, 'all tests completed')
}

runTests()
