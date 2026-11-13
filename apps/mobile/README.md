# Mortgage Calculator Mobile

This Expo app is the mobile shell for the mortgage calculator monorepo. It reuses the shared mortgage calculation, formatting, and translation code from `../../packages/core` while keeping native UI separate from the deployed Vite web app.

## Local development

Install the mobile dependencies from this folder:

```bash
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

## Building installable apps

Builds use [EAS Build](https://docs.expo.dev/build/introduction/) with the profiles in `eas.json`. You need a free Expo account; the first build links the project to it.

```bash
npm install -g eas-cli
eas login
```

Android APK for testing on a device (download link is printed when the build finishes):

```bash
eas build -p android --profile preview
```

iOS simulator build:

```bash
eas build -p ios --profile preview
```

Store builds (Android App Bundle / iOS archive):

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

### Building from GitHub Actions

The **Mobile build (EAS)** workflow (`.github/workflows/mobile-build.yml`) runs the same checks as CI and then starts an EAS build. Start it from **Actions → Mobile build (EAS) → Run workflow** and pick the platform and profile; pushing a tag such as `v1.0.0` starts a production Android build. The job submits the build and prints its link; the build itself runs on EAS and the download appears on expo.dev when it finishes.

One-time setup:

1. Link the project to your Expo account: run `npx eas-cli init` in this folder and commit the `projectId` it adds to `app.json`.
2. Create an access token at https://expo.dev/settings/access-tokens and add it as the repository secret `EXPO_TOKEN` (**Settings → Secrets and variables → Actions**).
3. For `production` builds, run one production build interactively first so EAS can create and store the signing credentials.

App identifiers are `com.samdalvai.mortgagecalculator` on both platforms. Bump `version` in `app.json` for each release, plus `android.versionCode` and `ios.buildNumber` for each store upload.

App icon, Android adaptive icon and splash screen live in `assets/`. They share a pixel-art icon with the web app, drawn on a 32x32 grid in `scripts/icon/pixel_icon.py`. To change it, edit the grid and regenerate everything from the repository root:

```bash
python3 scripts/icon/pixel_icon.py   # web SVG icons + build SVGs
node scripts/icon/render-png.cjs     # mobile PNGs (needs Playwright)
```
