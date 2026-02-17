# FinSort

AI-powered personal finance categorizer. Upload a CSV bank statement and FinSort uses Claude to automatically sort every transaction into categories like Groceries, Dining, Transport, and more — then visualizes your spending with interactive charts and a searchable transaction table.

![FinSort Screenshot](./screenshot.png)
<!-- Replace screenshot.png with an actual screenshot of the dashboard -->

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

## Supported CSV Formats

FinSort works with any CSV that has columns for **date**, **description**, and **amount**. After uploading, you map your columns to the right fields — no rigid format required.

Common bank exports that work out of the box:
- Chase, Bank of America, Wells Fargo, Citi statement CSVs
- Mint / Empower export files
- Any CSV with at least date, description, and amount columns

Extra columns (balance, check number, etc.) are ignored automatically.

## Categories

Groceries | Dining | Transport | Entertainment | Subscriptions | Housing | Utilities | Health | Shopping | Income | Transfer | Other

## Tech Stack

- **Framework**: Next.js 16 + TypeScript (App Router)
- **Styling**: TailwindCSS v4
- **AI**: Anthropic Claude API (claude-haiku-4-5-20251001)
- **Charts**: Recharts
- **CSV Parsing**: PapaParse
- **Deployment**: Vercel

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard
4. Deploy
