# Mobile Migration Steps

This report identifies the implementation steps needed to convert `apps/mobile` into a native version of the full app currently implemented in `apps/web`.

## Current State

`apps/mobile/App.tsx` is currently a small native shell with five inputs, hardcoded English labels, no persistence, no archive, no chart, no PDF export, and no installment list.

The full web app lives mostly in `apps/web/src/App.tsx`. The target should be feature parity with the web app's behavior, adapted to React Native primitives instead of copying DOM, Tailwind, browser storage, SVG, and PDF download code directly.

## Implementation Steps

1. Define the mobile feature parity target.

   Match the web app's behavior, not its exact DOM implementation. The web app uses browser APIs such as HTML inputs, SVG, `localStorage`, `Blob`, `document`, and `URL`, so those pieces need native equivalents.

2. Port the full application state.

   Add the state that exists in the web app but is missing in mobile:

   - `language`
   - `additionalAnnualPayment`
   - `additionalPaymentStrategy`
   - `showPlan`
   - `selectedChartYear`
   - `archivedPlans`
   - archived plan draft names
   - archive input name
   - archive feedback

3. Add persistence for inputs and archived plans.

   Replace the web app's `localStorage` usage with native storage, likely `@react-native-async-storage/async-storage`.

   The persisted data should include current calculator inputs, selected language, and up to 20 archived plans.

4. Port localization.

   Use `TRANSLATIONS` from `packages/core` in mobile and add a native language picker.

   Replace `getBrowserLanguage()` with a mobile-safe default, either a simple fallback or a device locale helper such as `expo-localization`.

5. Replace the mobile input component.

   The web `InputField` supports European number parsing, min/max clamping, step buttons, long-press increments, grouping, and decimal precision.

   Port this as a native `NumberInput` using `TextInput` and `Pressable`. The current mobile `NumericInput` only parses basic numbers and does not enforce the same constraints.

6. Add missing calculator fields.

   Mobile must add:

   - additional annual payment
   - additional payment strategy
   - validation for down payment greater than house cost
   - validation for additional annual payment greater than loan principal

7. Port the full summary output.

   Mobile currently shows only:

   - loan principal
   - monthly payment
   - total interest
   - total paid
   - calculated duration

   It should also show:

   - monthly rate without bank cost
   - total capital paid
   - total additional payments
   - total capital plus interest
   - total bank costs
   - interest saved
   - duration saved

8. Implement the chart.

   Port the web chart behavior to native using `react-native-svg` and a native slider such as `@react-native-community/slider`.

   Reuse the chart data calculation from the web app, but render with native SVG primitives instead of DOM `<svg>` elements.

9. Implement archived plans.

   Add the full archived plan workflow:

   - archive name input
   - save current plan
   - restore archived plan
   - update archived plan with current inputs
   - delete archived plan
   - archive feedback messages

   Use `FlatList` for archived plans if the list can grow.

10. Implement the installment plan list.

    Mobile should show and hide the full amortization plan, including monthly payment, principal, interest, bank cost, additional payment, and remaining capital.

    Use `FlatList` instead of mapping every installment inside one `ScrollView`, because a long mortgage can produce hundreds of rows.

11. Adapt PDF export.

    The current web PDF helper creates a `Blob` and downloads it through `document`, which will not work on native.

    Refactor PDF generation into a pure shared function that returns PDF content as text, bytes, or base64. Then create separate platform wrappers:

    - web wrapper: `Blob` plus download link
    - mobile wrapper: `expo-file-system` plus `expo-sharing`

12. Add mobile dependencies.

    Likely install with `npx expo install`:

    - `@react-native-async-storage/async-storage`
    - `@react-native-picker/picker`
    - `@react-native-community/slider`
    - `react-native-svg`
    - `expo-file-system`
    - `expo-sharing`
    - `expo-localization`

13. Refactor shared logic.

    Move reusable non-UI logic out of `apps/web/src/App.tsx` and into `packages/core`.

    Good candidates:

    - default inputs
    - persisted input validation
    - archive parsing
    - archive limits
    - chart data generation
    - PDF line generation
    - language locale mapping

14. Verify the migration.

    Run the repo tests and Expo bundle checks:

    ```bash
    npm test
    cd apps/mobile
    npx expo export --platform android --clear
    npx expo export --platform ios --clear
    ```

    Manually test:

    - input editing and clamping
    - language switching
    - persistence after app restart
    - archived plan save, update, restore, and delete
    - chart slider behavior
    - installment list rendering performance
    - PDF file creation and sharing on device or emulator

## Suggested Implementation Order

1. Shared pure logic extraction into `packages/core`.
2. Native input and form parity.
3. Summary and validation parity.
4. Persistence and language selection.
5. Archived plans.
6. Chart.
7. Installment list.
8. PDF export.
9. Final native QA pass.
