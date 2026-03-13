# Branded Notepad Generator

Static web app for creating branded A4 notepad pages and exporting them through the browser print flow as PDF.

## What It Does

- customizable header label, title, footer text, and colors
- optional logo upload
- rich-text message editor built with Lexical
- date and place fields
- automatic multi-page A4 pagination for print
- browser-based `Print / Save PDF` output

## Tech Stack

- Vite
- Lexical
- plain HTML, CSS, and JavaScript

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL in your browser.

## Production Build

```bash
npm run build
```

The built static site is written to:

- `dist/`

## Build-Time Defaults

This app supports build-time branding defaults through Vite environment variables.

Copy [.env.example](/Users/suku/github/lscnotepad/.env.example) to `.env` or set the variables in your build environment:

```bash
VITE_HEADER_LABEL="Brand Label"
VITE_HEADER_TITLE="Branded Notepad"
VITE_FOOTER_TEXT="123 Example Street, Sydney NSW 2000"
VITE_HEADER_COLOR="#213547"
VITE_FOOTER_COLOR="#2e4f3f"
VITE_PLACE_TEXT="Add a place"
VITE_LOGO_URL="/branding/logo.png"
```

Notes:

- `VITE_HEADER_COLOR` and `VITE_FOOTER_COLOR` should be valid hex colors.
- `VITE_LOGO_URL` is optional.
- `VITE_LOGO_URL` should point to a logo file that will exist in the deployed site, for example a file under `public/`.
- users can still change the values in the UI after the page loads.

## Preview Production Build Locally

```bash
npm run preview
```

## Deploy

This project builds to static files, so you can deploy the contents of `dist/` to any static host or web server.

Typical options:

- GitHub Pages
- Netlify
- Cloudflare Pages
- `nginx` serving the built `dist/` directory

Example basic flow:

```bash
npm install
npm run build
```

If you want a branded build for a specific deployment, set the `VITE_*` variables before running `npm run build`.

Then publish the files from:

- `dist/`

## GitHub Pages

A GitHub Actions workflow is included at [.github/workflows/github-pages.yml](/Users/suku/github/lscnotepad/.github/workflows/github-pages.yml).

It:

- installs dependencies
- builds the Vite app
- deploys `dist/` to GitHub Pages

### Setup

1. Push the repository to GitHub.
2. In GitHub, open `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the Actions tab.

### Optional Repository Variables

Set these in `Settings -> Secrets and variables -> Actions -> Variables` if you want branded defaults in the deployed build:

- `VITE_HEADER_LABEL`
- `VITE_HEADER_TITLE`
- `VITE_FOOTER_TEXT`
- `VITE_HEADER_COLOR`
- `VITE_FOOTER_COLOR`
- `VITE_PLACE_TEXT`
- `VITE_LOGO_URL`
- `VITE_BASE_PATH`

Notes:

- If `VITE_BASE_PATH` is not set, the GitHub Pages workflow automatically uses `/<repository-name>/`.
- For a custom domain, set `VITE_BASE_PATH` to `/`.
- For a project Pages site at `https://username.github.io/repository-name/`, you can leave `VITE_BASE_PATH` unset or set it explicitly to `/repository-name/`.

## PDF Export

Use the `Print / Save PDF` button in the app, then choose `Save as PDF` in the browser print dialog.

Notes:

- Chrome generally gives the most reliable PDF output.
- Safari may render print backgrounds differently than Chrome.
- If header or footer colors are missing in print, enable background graphics in the print dialog if your browser provides that option.
