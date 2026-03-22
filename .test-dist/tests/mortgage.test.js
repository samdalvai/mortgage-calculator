import { calculateMortgagePlan } from '../src/lib/mortgage.js';
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function testFrenchMortgageWithInterestAndBankCost() {
    const result = calculateMortgagePlan({
        houseCost: 200000,
        downPayment: 20000,
        years: 30,
        annualInterestRate: 0.03,
        monthlyBankCost: 2,
    });
    assertEqual(result.principal, 180000, 'principal');
    assertEqual(result.monthlyRateWithoutBankCost, 758.89, 'monthlyRateWithoutBankCost');
    assertEqual(result.monthlyPayment, 760.89, 'monthlyPayment');
    assertEqual(result.totalCapitalPaid, 180000, 'totalCapitalPaid');
    assertEqual(result.installments.length, 360, 'installments length');
    const first = result.installments[0];
    assertEqual(first.payment, 760.89, 'first payment');
    assertEqual(first.principal, 308.89, 'first principal');
    assertEqual(first.interest, 450, 'first interest');
    assertEqual(first.remainingPrincipal, 179691.11, 'first remaining principal');
    const lastInstallment = result.installments[result.installments.length - 1];
    assertEqual(lastInstallment.remainingPrincipal, 0, 'last remaining principal');
    assertEqual(lastInstallment.bankCost, 2, 'last bank cost');
    assertEqual(result.totalCapitalAndInterest, 273199.3, 'totalCapitalAndInterest');
    assertEqual(result.totalPaid, 273919.3, 'totalPaid');
}
function testZeroInterest() {
    const result = calculateMortgagePlan({
        houseCost: 120000,
        downPayment: 20000,
        years: 10,
        annualInterestRate: 0,
        monthlyBankCost: 0,
    });
    assertEqual(result.monthlyRateWithoutBankCost, 833.33, 'zero-interest monthly rate');
    assertEqual(result.totalCapitalPaid, 100000, 'zero-interest totalCapitalPaid');
    assertEqual(result.totalInterest, 0, 'zero-interest totalInterest');
    assertEqual(result.totalCapitalAndInterest, 100000, 'zero-interest totalCapitalAndInterest');
    assertEqual(result.installments.length, 120, 'zero-interest installments length');
    assertEqual(result.installments[0].interest, 0, 'zero-interest first installment interest');
    assertEqual(result.installments[result.installments.length - 1].remainingPrincipal, 0, 'zero-interest last remaining principal');
}
function testAdditionalAnnualPaymentShortensDuration() {
    const baseline = calculateMortgagePlan({
        houseCost: 250000,
        downPayment: 50000,
        years: 25,
        annualInterestRate: 0.03,
        monthlyBankCost: 0,
    });
    const accelerated = calculateMortgagePlan({
        houseCost: 250000,
        downPayment: 50000,
        years: 25,
        annualInterestRate: 0.03,
        monthlyBankCost: 0,
        additionalAnnualPayment: 5000,
        additionalPaymentStrategy: 'shorten-duration',
    });
    assert(accelerated.durationMonths < baseline.durationMonths, 'additional payment should shorten duration');
    assert(accelerated.totalInterest < baseline.totalInterest, 'additional payment should reduce total interest');
    assert(accelerated.totalAdditionalPayments > 0, 'additional payment total should be tracked');
}
function testAdditionalAnnualPaymentCanReduceMonthlyPayment() {
    const recast = calculateMortgagePlan({
        houseCost: 300000,
        downPayment: 50000,
        years: 30,
        annualInterestRate: 0.035,
        monthlyBankCost: 0,
        additionalAnnualPayment: 4000,
        additionalPaymentStrategy: 'reduce-payment',
    });
    const month12 = recast.installments[11];
    const month13 = recast.installments[12];
    assert(month12.additionalPayment > 0, 'month 12 should include annual additional payment');
    assert(month13.principal < month12.principal, 'after recast, principal component should decrease due to lower monthly payment');
}
function runTests() {
    testFrenchMortgageWithInterestAndBankCost();
    testZeroInterest();
    testAdditionalAnnualPaymentShortensDuration();
    testAdditionalAnnualPaymentCanReduceMonthlyPayment();
    assert(true, 'all tests completed');
}
runTests();
