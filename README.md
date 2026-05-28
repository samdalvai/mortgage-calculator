# Mortgage Calculator

A browser-based mortgage calculator for building and comparing mortgage repayment plans.

The app computes a French amortization schedule from the house cost, down payment, duration, annual interest rate, and monthly bank costs. It shows the monthly payment, total capital repaid, total interest, bank costs, overall amount paid, and a month-by-month repayment plan.

## What It Calculates

- Loan principal from house cost minus down payment
- Fixed French-amortization monthly payment
- Monthly split between principal, interest, bank cost, and optional extra payment
- Remaining capital after each installment
- Total capital, interest, bank costs, extra payments, and total paid
- Interest and duration saved when extra annual payments are enabled

## Features

- Inputs for house cost, down payment, mortgage duration, annual interest rate, and monthly bank cost
- Optional annual additional payments
- Two additional-payment strategies:
  - shorten the mortgage duration
  - reduce the future monthly payment
- Interactive chart for remaining capital, repaid capital, and paid interest over time
- Full monthly repayment plan table
- PDF export of the mortgage plan
- Local archive for saving and restoring scenarios
- Interface translations for English, Italian, French, and German

## Calculation Notes

The main calculation lives in `src/lib/mortgage.ts`.

Monthly interest is calculated from the annual rate divided by 12. The base monthly payment uses the standard French amortization formula, then monthly bank costs are added separately. Extra annual payments are applied every 12th installment when configured.

When the extra-payment strategy is set to shorten duration, the regular monthly payment stays the same and the loan ends earlier. When the strategy is set to reduce monthly payment, the remaining principal is recast over the remaining months after each extra payment.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run the mortgage calculation tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```
