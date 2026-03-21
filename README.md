# Mortgage Calculator (React + TypeScript + Tailwind)

This repository contains a baseline React web app scaffolded with TypeScript and Tailwind CSS, plus a GitHub Actions workflow to deploy to GitHub Pages.

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

4. Preview production build:

   ```bash
   npm run preview
   ```

## GitHub Pages deployment

A workflow file is included at `.github/workflows/deploy.yml`.

### One-time setup on GitHub

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to your default branch (or manually run the workflow from the Actions tab).

After deployment, your app will be available at:

- `https://<your-github-username>.github.io/mortgage-calculator/`

> If your repository name is different, replace `mortgage-calculator` with your actual repo name.

