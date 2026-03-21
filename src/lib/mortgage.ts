export type MortgageInput = {
  houseCost: number
  downPayment: number
  years: number
  annualInterestRate: number
  monthlyBankCost: number
}

export type MortgageInstallment = {
  month: number
  payment: number
  principal: number
  interest: number
  bankCost: number
  remainingPrincipal: number
}

export type MortgagePlan = {
  principal: number
  monthlyRateWithoutBankCost: number
  monthlyPayment: number
  totalCapitalPaid: number
  totalInterest: number
  totalCapitalAndInterest: number
  totalBankCosts: number
  totalPaid: number
  installments: MortgageInstallment[]
}

const roundToCents = (value: number): number => Math.round(value * 100) / 100

export function calculateMortgagePlan(input: MortgageInput): MortgagePlan {
  const principal = Math.max(input.houseCost - input.downPayment, 0)
  const totalMonths = Math.max(Math.floor(input.years * 12), 0)

  if (principal === 0 || totalMonths === 0) {
    return {
      principal,
      monthlyRateWithoutBankCost: 0,
      monthlyPayment: roundToCents(input.monthlyBankCost),
      totalCapitalPaid: 0,
      totalInterest: 0,
      totalCapitalAndInterest: 0,
      totalBankCosts: roundToCents(input.monthlyBankCost * totalMonths),
      totalPaid: roundToCents(input.monthlyBankCost * totalMonths),
      installments: Array.from({ length: totalMonths }, (_, index) => ({
        month: index + 1,
        payment: roundToCents(input.monthlyBankCost),
        principal: 0,
        interest: 0,
        bankCost: roundToCents(input.monthlyBankCost),
        remainingPrincipal: 0,
      })),
    }
  }

  const monthlyRate = input.annualInterestRate / 12
  const monthlyRateWithoutBankCost =
    monthlyRate === 0
      ? principal / totalMonths
      : principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)))

  let remainingPrincipal = principal
  const installments: MortgageInstallment[] = []

  for (let month = 1; month <= totalMonths; month += 1) {
    const rawInterest = monthlyRate === 0 ? 0 : remainingPrincipal * monthlyRate
    const rawPrincipal =
      month === totalMonths
        ? remainingPrincipal
        : Math.max(monthlyRateWithoutBankCost - rawInterest, 0)

    const principalPaid = roundToCents(rawPrincipal)
    const interestPaid = roundToCents(rawInterest)

    remainingPrincipal = roundToCents(Math.max(remainingPrincipal - principalPaid, 0))

    const basePayment = principalPaid + interestPaid
    const payment = roundToCents(basePayment + input.monthlyBankCost)

    installments.push({
      month,
      payment,
      principal: principalPaid,
      interest: interestPaid,
      bankCost: roundToCents(input.monthlyBankCost),
      remainingPrincipal,
    })
  }

  const totalCapitalPaid = roundToCents(installments.reduce((acc, curr) => acc + curr.principal, 0))
  const totalInterest = roundToCents(installments.reduce((acc, curr) => acc + curr.interest, 0))
  const totalCapitalAndInterest = roundToCents(totalCapitalPaid + totalInterest)
  const totalBankCosts = roundToCents(totalMonths * input.monthlyBankCost)
  const totalPaid = roundToCents(installments.reduce((acc, curr) => acc + curr.payment, 0))

  return {
    principal: roundToCents(principal),
    monthlyRateWithoutBankCost: roundToCents(monthlyRateWithoutBankCost),
    monthlyPayment: roundToCents(monthlyRateWithoutBankCost + input.monthlyBankCost),
    totalCapitalPaid,
    totalInterest,
    totalCapitalAndInterest,
    totalBankCosts,
    totalPaid,
    installments,
  }
}
