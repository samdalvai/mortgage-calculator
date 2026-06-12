# Mobile Migration Status

This document tracks the migration of `apps/mobile` into a native version of the full mortgage calculator currently implemented in `apps/web`.

## Implemented

1. Shared core logic extraction.

   Added reusable app-state helpers in `packages/core/src/lib/app-state.ts`:

   - default calculator inputs
   - persisted input parsing
   - archived plan parsing
   - archive constants
   - language locale mapping
   - chart data generation
   - validation error classification

2. Shared PDF generation.

   Added pure PDF document generation in `packages/core/src/lib/pdf.ts`.

   The web app now keeps only browser download plumbing in `apps/web/src/lib/pdf.ts`, while both web and mobile can reuse the same PDF content generator.

3. Full mobile calculator state.

   `apps/mobile/App.tsx` now includes:

   - language selection
   - house cost
   - down payment
   - mortgage duration
   - annual interest rate
   - monthly bank cost
   - additional annual payment
   - additional payment strategy
   - chart year selection
   - archived plans
   - full amortization plan visibility

4. Mobile component structure.

   The mobile app now mirrors the web app's organization with reusable UI in `apps/mobile/components`:

   - `ActionButton.tsx`
   - `DisplayValue.tsx`
   - `InteractiveChart.tsx`
   - `NumberInput.tsx`
   - `SegmentedControl.tsx`

   `apps/mobile/App.tsx` now focuses on state, persistence, calculations, and feature orchestration.

5. Native input parity.

   Replaced the simple mobile numeric input with a native `NumberInput` that supports:

   - European number parsing
   - formatted display
   - decimal precision
   - min/max clamping
   - step buttons
   - grouped numbers

6. Localization.

   Mobile now uses `TRANSLATIONS` from `packages/core` and supports English, Italian, French, and German through native segmented controls.

   The initial language now defaults from the device locale through `expo-localization`, falling back to English when the device language is unsupported.

7. Validation.

   Mobile now matches the web validation rules:

   - down payment cannot exceed house cost
   - additional annual payment cannot exceed loan principal

8. Full summary parity.

   Mobile now shows the same summary surface as web:

   - loan principal
   - monthly payment
   - monthly rate without bank cost
   - total capital paid
   - total interest
   - total additional payments
   - total capital plus interest
   - total bank costs
   - total paid
   - interest saved
   - duration saved

9. Native chart inspection.

   Mobile now computes the same yearly chart data as web and renders a native SVG line chart with a slider using `react-native-svg` and `@react-native-community/slider`.

   The chart includes:

   - remaining capital
   - reimbursed capital
   - paid interest
   - selected-year guide line
   - yearly value legends

10. Archived plans.

   Mobile now supports:

   - naming the current plan
   - archiving the current plan
   - restoring archived plans
   - saving current changes into an archived plan
   - deleting archived plans
   - archive feedback messages
   - limiting archives to `MAX_ARCHIVED_PLANS`

11. Persistence.

    Mobile now persists calculator inputs and archived plans through `expo-file-system`.

12. Installment plan list.

   Mobile now shows and hides the full amortization plan, including:

    - payment
    - principal
    - interest
    - bank cost
    - additional payment
    - remaining capital
    - plan totals

    The screen now uses `FlatList` so long amortization plans render lazily instead of mapping hundreds of rows inside a single scroll view.

13. Mobile PDF export.

    Mobile now creates the mortgage plan PDF content with shared core logic, writes the PDF file into the app document directory with `expo-file-system`, and opens the platform share sheet with `expo-sharing` when available.

14. Verification.

    Completed checks:

    ```bash
    npx tsc --noEmit -p apps/mobile/tsconfig.json
    npm run test
    npm run lint
    npx expo export --platform android --output-dir /private/tmp/mortgage-mobile-export --clear
    npx expo export --platform ios --output-dir /private/tmp/mortgage-mobile-export-ios --clear
    npm run build:web
    ```

## Native Differences

The mobile app intentionally keeps a native implementation rather than copying DOM/Tailwind code directly.

1. Storage.

   The original report suggested AsyncStorage. Mobile currently uses `expo-file-system`, which is already available in the Expo dependency tree and works for both persisted inputs and archived plan JSON.

2. PDF fallback.

   Mobile opens the native share sheet when available. If the share API is unavailable on a platform, it reports the generated file path.

## Remaining Enhancements

1. Manually test on Android and iOS devices or emulators:

   - persistence after app restart
   - archive save, update, restore, and delete
   - PDF file creation and native sharing
   - long amortization plan scrolling
   - language switching
   - SVG chart rendering and slider behavior
