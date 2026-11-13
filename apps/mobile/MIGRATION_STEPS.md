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
   - dot or comma decimal separators via the shared `parseLocalizedNumber`, since mobile keypads often only offer "."
   - an integer-only keypad for fields without decimals

6. Localization.

   Mobile now uses `TRANSLATIONS` from `packages/core` and supports English, Italian, French, and German through native segmented controls.

   The initial language now defaults from the device locale through `expo-localization`, falling back to English when the device language is unsupported.

   Screen-reader labels (step buttons, chart year slider) and storage and PDF error messages are translated too. Storage errors are kept as an error kind and rendered in the current language, cleared after the next successful save, and their technical details go to the console.

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
   - deleting archived plans, after a native confirmation dialog
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

    The list adjusts its insets for the keyboard on iOS so focused fields stay visible, and dragging the list dismisses the keyboard.

13. Mobile PDF export.

    Mobile now creates the mortgage plan PDF content with shared core logic, writes it to the app cache directory with `expo-file-system` (replacing earlier exports, which the OS may also clear), and opens the platform share sheet with `expo-sharing` when available. A translated confirmation with the file name appears under the actions, the export button is disabled while a PDF is being created, and PDFs that older versions kept in the document directory are removed on start-up.

14. Build configuration.

    `app.json` now defines version `1.0.0`, the `com.samdalvai.mortgagecalculator` app identifier for Android and iOS, the app icon, Android adaptive icon, splash screen and a fixed dark interface style. `eas.json` provides a `preview` profile that builds an installable Android APK (and an iOS simulator build) and a `production` profile for store builds. See `README.md` for the commands.

15. Safe areas.

    The screen uses `react-native-safe-area-context` instead of React Native's iOS-only `SafeAreaView`, so content stays clear of the status bar, notches and the Android gesture bar on both platforms. The Android status bar is explicitly translucent and the bottom inset is added to the list padding, so the last items can scroll above the gesture bar.

16. Tests.

    Device-language detection now uses the shared `resolveSupportedLanguage` helper (also used by the web app's browser detection). `npm run test` runs every file in `tests/`, covering mortgage calculation, number parsing, language detection, persisted input and archive parsing, validation, chart data, and PDF generation including its cross-reference table. Tests are compiled to CommonJS so the shared code's extensionless imports resolve in Node.

17. Verification.

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

   Mobile opens the native share sheet when available. If the share API is unavailable on a platform, it shows a translated message with the generated file path.

## Remaining Enhancements

1. Manually test on Android and iOS devices or emulators:

   - persistence after app restart
   - archive save, update, restore, and delete
   - PDF file creation and native sharing
   - long amortization plan scrolling
   - language switching
   - SVG chart rendering and slider behavior
