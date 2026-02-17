# FinSort

FinSort is an AI-powered personal finance analyzer that turns raw bank statements into categorized spending insights. Upload a CSV or PDF bank statement and FinSort uses Claude to automatically sort every transaction into categories like Groceries, Dining, Transport, and more — then visualizes your spending with interactive charts, detects recurring subscriptions, flags anomalous transactions, and lets you export a polished PDF report.

![FinSort Dashboard](./screenshot.png)
<!-- Replace screenshot.png with an actual screenshot of your dashboard -->

## Features

- **CSV & PDF Upload** — Drag-and-drop bank statements with automatic column detection
- **AI Categorization** — Claude Haiku classifies transactions into 12 spending categories
- **Spending Dashboard** — Summary cards, category donut chart, spending timeline, and top merchants
- **Recurring Subscription Detection** — Automatically identifies weekly, monthly, and yearly charges
- **Anomaly Alerts** — Flags unusually large charges, category spikes, possible duplicates, and new merchants
- **PDF Export** — Generate a clean A4 report with summary stats, category breakdown, and top merchants
- **Dark / Light Mode** — System preference detection with manual toggle and no flash on load

## Tech Stack

- **Framework**: Next.js 16 + TypeScript (App Router)
- **Styling**: TailwindCSS v4
- **AI**: Anthropic Claude API (`claude-haiku-4-5-20251001`)
- **Charts**: Recharts
- **CSV Parsing**: PapaParse
- **PDF Parsing**: pdfjs-dist
- **PDF Export**: jsPDF

## Setup

```bash
git clone <your-repo-url>
cd Personal-Finance-Analyzer
npm install
```

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Get an API key from [console.anthropic.com](https://console.anthropic.com/).

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Categories

Groceries | Dining | Transport | Entertainment | Subscriptions | Housing | Utilities | Health | Shopping | Income | Transfer | Other

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard
4. Deploy
