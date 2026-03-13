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
cd /Users/suku/github/lscnotepad
npm install
npm run dev
```

Open the local Vite URL in your browser.

## Production Build

```bash
cd /Users/suku/github/lscnotepad
npm run build
```

The built static site is written to:

- `/Users/suku/github/lscnotepad/dist`

## Preview Production Build Locally

```bash
cd /Users/suku/github/lscnotepad
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
cd /Users/suku/github/lscnotepad
npm install
npm run build
```

Then publish the files from:

- `/Users/suku/github/lscnotepad/dist`

## PDF Export

Use the `Print / Save PDF` button in the app, then choose `Save as PDF` in the browser print dialog.

Notes:

- Chrome generally gives the most reliable PDF output.
- Safari may render print backgrounds differently than Chrome.
- If header or footer colors are missing in print, enable background graphics in the print dialog if your browser provides that option.
