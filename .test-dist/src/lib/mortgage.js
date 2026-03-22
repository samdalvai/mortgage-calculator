const roundToCents = (value) => Math.round(value * 100) / 100;
const calculateFrenchMonthlyPayment = (principal, monthlyRate, months) => {
    if (months <= 0 || principal <= 0) {
        return 0;
    }
    if (monthlyRate === 0) {
        return principal / months;
    }
    return principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
};
export function calculateMortgagePlan(input) {
    const principal = Math.max(input.houseCost - input.downPayment, 0);
    const totalMonths = Math.max(Math.floor(input.years * 12), 0);
    const additionalAnnualPayment = Math.max(input.additionalAnnualPayment ?? 0, 0);
    const additionalPaymentStrategy = input.additionalPaymentStrategy ?? 'shorten-duration';
    if (principal === 0 || totalMonths === 0) {
        return {
            principal,
            monthlyRateWithoutBankCost: 0,
            monthlyPayment: roundToCents(input.monthlyBankCost),
            totalCapitalPaid: 0,
            totalInterest: 0,
            totalCapitalAndInterest: 0,
            totalBankCosts: roundToCents(input.monthlyBankCost * totalMonths),
            totalAdditionalPayments: 0,
            totalPaid: roundToCents(input.monthlyBankCost * totalMonths),
            durationMonths: totalMonths,
            installments: Array.from({ length: totalMonths }, (_, index) => ({
                month: index + 1,
                payment: roundToCents(input.monthlyBankCost),
                principal: 0,
                interest: 0,
                bankCost: roundToCents(input.monthlyBankCost),
                additionalPayment: 0,
                remainingPrincipal: 0,
            })),
        };
    }
    const monthlyRate = input.annualInterestRate / 12;
    let monthlyRateWithoutBankCost = calculateFrenchMonthlyPayment(principal, monthlyRate, totalMonths);
    let remainingPrincipal = principal;
    const installments = [];
    for (let month = 1; month <= totalMonths && remainingPrincipal > 0; month += 1) {
        const remainingMonths = totalMonths - month + 1;
        const rawInterest = monthlyRate === 0 ? 0 : remainingPrincipal * monthlyRate;
        const scheduledRawPrincipal = remainingMonths === 1
            ? remainingPrincipal
            : Math.max(monthlyRateWithoutBankCost - rawInterest, 0);
        const principalPaid = roundToCents(Math.min(scheduledRawPrincipal, remainingPrincipal));
        const interestPaid = roundToCents(rawInterest);
        remainingPrincipal = roundToCents(Math.max(remainingPrincipal - principalPaid, 0));
        const shouldApplyAdditionalPayment = additionalAnnualPayment > 0 && month % 12 === 0 && remainingPrincipal > 0;
        const extraPrincipalPaid = shouldApplyAdditionalPayment
            ? roundToCents(Math.min(additionalAnnualPayment, remainingPrincipal))
            : 0;
        if (extraPrincipalPaid > 0) {
            remainingPrincipal = roundToCents(Math.max(remainingPrincipal - extraPrincipalPaid, 0));
        }
        if (additionalPaymentStrategy === 'reduce-payment' && extraPrincipalPaid > 0 && remainingPrincipal > 0) {
            const remainingMonthsAfterCurrent = totalMonths - month;
            monthlyRateWithoutBankCost = calculateFrenchMonthlyPayment(remainingPrincipal, monthlyRate, remainingMonthsAfterCurrent);
        }
        const payment = roundToCents(principalPaid + interestPaid + extraPrincipalPaid + input.monthlyBankCost);
        installments.push({
            month,
            payment,
            principal: principalPaid,
            interest: interestPaid,
            bankCost: roundToCents(input.monthlyBankCost),
            additionalPayment: extraPrincipalPaid,
            remainingPrincipal,
        });
    }
    const totalCapitalPaid = roundToCents(installments.reduce((acc, curr) => acc + curr.principal, 0));
    const totalInterest = roundToCents(installments.reduce((acc, curr) => acc + curr.interest, 0));
    const totalAdditionalPayments = roundToCents(installments.reduce((acc, curr) => acc + curr.additionalPayment, 0));
    const totalCapitalAndInterest = roundToCents(totalCapitalPaid + totalAdditionalPayments + totalInterest);
    const totalBankCosts = roundToCents(installments.length * input.monthlyBankCost);
    const totalPaid = roundToCents(installments.reduce((acc, curr) => acc + curr.payment, 0));
    return {
        principal: roundToCents(principal),
        monthlyRateWithoutBankCost: roundToCents(calculateFrenchMonthlyPayment(principal, monthlyRate, totalMonths)),
        monthlyPayment: roundToCents(calculateFrenchMonthlyPayment(principal, monthlyRate, totalMonths) + input.monthlyBankCost),
        totalCapitalPaid,
        totalInterest,
        totalCapitalAndInterest,
        totalBankCosts,
        totalAdditionalPayments,
        totalPaid,
        durationMonths: installments.length,
        installments,
    };
}
