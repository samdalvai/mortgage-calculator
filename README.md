# Mortgage Calculator

A monorepo for a mortgage calculator with a GitHub Pages web app and an Expo mobile app shell.

The app computes a French amortization schedule from the house cost, down payment, duration, annual interest rate, and monthly bank costs. It shows the monthly payment, total capital repaid, total interest, bank costs, overall amount paid, and a month-by-month repayment plan.

## Repository Layout

```text
apps/
  web/       Vite + React web app deployed to GitHub Pages
  mobile/    Expo + React Native mobile app shell
packages/
  core/      Shared mortgage calculation, formatting, and translation code
tests/       Shared calculation tests
```

The web and mobile apps intentionally keep separate UI layers while sharing the business logic in `packages/core`.

## What It Calculates

- Loan principal from house cost minus down payment
- Fixed French-amortization monthly payment
- Monthly split between principal, interest, bank cost, and optional extra payment
- Remaining capital after each installment
- Total capital, interest, bank costs, extra payments, and total paid
- Interest and duration saved when extra annual payments are enabled

## Features

### Web app

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
- GitHub Pages deployment through `.github/workflows/deploy.yml`

### Mobile app

- Expo app scaffold in `apps/mobile`
- Native React Native UI shell for the key calculator inputs and summary values
- Shared calculation and formatting code from `packages/core`

## Calculation Notes

The main calculation lives in `packages/core/src/lib/mortgage.ts`.

Monthly interest is calculated from the annual rate divided by 12. The base monthly payment uses the standard French amortization formula, then monthly bank costs are added separately. Extra annual payments are applied every 12th installment when configured.

When the extra-payment strategy is set to shorten duration, the regular monthly payment stays the same and the loan ends earlier. When the strategy is set to reduce monthly payment, the remaining principal is recast over the remaining months after each extra payment.

## Web Development

Install root dependencies:

```bash
npm install
```

Start the web development server:

```bash
npm run dev:web
```

Run the mortgage calculation tests:

```bash
npm test
```

Build the web app for production:

```bash
npm run build:web
```

The default `npm run dev`, `npm run build`, and `npm run deploy` scripts continue to target the web app so the existing GitHub Pages deployment stays intact.

## Mobile Development

Install mobile dependencies separately from the mobile app folder:

```bash
cd apps/mobile
npm install
```

Start Expo:

```bash
npm run start
```

Run on a platform:

```bash
npm run ios
npm run android
npm run web
```
