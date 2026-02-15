import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, type Category } from '@/types/transaction';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface TransactionInput {
  description: string;
  amount: number;
}

interface CategorizeResult {
  index: number;
  category: Category;
  confidence: number;
}

const SYSTEM_PROMPT = `You are a financial transaction categorizer. Given a list of bank transactions (description and amount), categorize each into exactly one of these categories:

- Groceries: Supermarkets, grocery stores, farmers markets (Walmart Grocery, Whole Foods, Trader Joe's)
- Dining: Restaurants, cafes, fast food, food delivery (Starbucks, DoorDash, McDonald's)
- Transport: Gas, rideshare, public transit, parking, tolls (Uber, Shell, MTA)
- Entertainment: Movies, concerts, games, streaming, hobbies (Netflix, Spotify, AMC Theatres)
- Subscriptions: Recurring digital services, memberships, software (Adobe, iCloud, gym membership)
- Housing: Rent, mortgage, property tax, HOA, home insurance (Zillow, landlord payments)
- Utilities: Electric, gas, water, internet, phone bills (Verizon, ConEd, Comcast)
- Health: Medical, dental, pharmacy, fitness, insurance premiums (CVS Pharmacy, Kaiser, dentist)
- Shopping: Retail, clothing, electronics, home goods, online shopping (Amazon, Target, Nike)
- Income: Salary, freelance payments, refunds, interest, dividends (payroll, direct deposit, Venmo received)
- Transfer: Bank transfers, credit card payments, investment moves (Zelle, wire transfer, 401k)
- Other: Anything that doesn't clearly fit another category

Rules:
- Positive amounts are likely Income or Transfer (money coming in)
- Negative amounts are expenses
- Respond with ONLY a JSON array, no markdown fences, no explanation
- Format: [{"index": 0, "category": "Groceries", "confidence": 0.95}, ...]
- Confidence is 0.0 to 1.0 based on how certain you are of the categorization`;

function validateTransactions(body: unknown): TransactionInput[] | null {
  if (!body || typeof body !== 'object' || !('transactions' in body)) {
    return null;
  }

  const { transactions } = body as { transactions: unknown };

  if (!Array.isArray(transactions)) return null;

  for (const tx of transactions) {
    if (
      !tx ||
      typeof tx !== 'object' ||
      typeof tx.description !== 'string' ||
      typeof tx.amount !== 'number'
    ) {
      return null;
    }
  }

  return transactions as TransactionInput[];
}

function parseResults(
  text: string,
  count: number
): CategorizeResult[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      category: 'Other' as Category,
      confidence: 0,
    }));
  }

  const parsed: { index: number; category: string; confidence: number }[] =
    JSON.parse(jsonMatch[0]);

  return parsed.map((item) => ({
    index: item.index,
    category: CATEGORIES.includes(item.category as Category)
      ? (item.category as Category)
      : 'Other',
    confidence: Math.max(0, Math.min(1, item.confidence ?? 0)),
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const transactions = validateTransactions(body);

    if (!transactions) {
      return NextResponse.json(
        { error: 'Expected {transactions: {description: string, amount: number}[]}' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const userMessage = JSON.stringify(
      transactions.map((tx, i) => ({
        index: i,
        description: tx.description,
        amount: tx.amount,
      }))
    );

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '[]';
    const results = parseResults(text, transactions.length);

    return NextResponse.json({ results });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
