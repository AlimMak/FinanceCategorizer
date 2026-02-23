import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, type Category } from '@/types/transaction';
import { isRateLimited, getRateLimitInfo } from '@/utils/rate-limiter';
import { logError } from '@/utils/logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_TRANSACTIONS_PER_REQUEST = 200;

// Rate limiting: 50 requests per 15 minutes per IP
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
};

interface TransactionInput {
  description: string;
  amount: number;
}

interface CategorizeResult {
  index: number;
  category: Category;
  confidence: number;
}

// Max transaction amount (prevent overflow/abuse)
const MAX_TRANSACTION_AMOUNT = 999_999_999.99;

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

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

function validateAPIKey(request: NextRequest): boolean {
  const apiKey = process.env.API_KEY;

  // If no API_KEY is configured, skip validation (development mode)
  if (!apiKey) {
    return true;
  }

  // If API_KEY is configured, require Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  // Check for Bearer token format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(apiKey));
  } catch {
    // Buffers not equal length - invalid token
    return false;
  }
}

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

    // Validate amount is a valid finite number within bounds
    if (
      !Number.isFinite(tx.amount) ||
      Math.abs(tx.amount) > MAX_TRANSACTION_AMOUNT
    ) {
      return null;
    }
  }

  return transactions as TransactionInput[];
}

function makeFallbackResults(count: number): CategorizeResult[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    category: 'Other' as Category,
    confidence: 0,
  }));
}

function parseResults(
  text: string,
  count: number
): CategorizeResult[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return makeFallbackResults(count);
  }

  let parsed: unknown[];
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return makeFallbackResults(count);
  }

  if (!Array.isArray(parsed)) {
    return makeFallbackResults(count);
  }

  const results: CategorizeResult[] = [];

  for (const raw of parsed) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    if (
      typeof item.index !== 'number' ||
      !Number.isInteger(item.index) ||
      item.index < 0 ||
      item.index >= count
    ) continue;

    const category = typeof item.category === 'string' &&
      CATEGORIES.includes(item.category as Category)
      ? (item.category as Category)
      : 'Other';

    const confidence = typeof item.confidence === 'number'
      ? Math.max(0, Math.min(1, item.confidence))
      : 0;

    results.push({ index: item.index, category, confidence });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key (if configured)
    if (!validateAPIKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check rate limit
    const clientIP = getClientIP(request);
    if (isRateLimited(clientIP, RATE_LIMIT_CONFIG)) {
      const { resetTime } = getRateLimitInfo(clientIP, RATE_LIMIT_CONFIG);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    // 3. Validate request body
    const body: unknown = await request.json();
    const transactions = validateTransactions(body);

    if (!transactions) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json({ results: [] });
    }

    if (transactions.length > MAX_TRANSACTIONS_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Too many transactions. Maximum ${MAX_TRANSACTIONS_PER_REQUEST} per request.`,
        },
        { status: 400 }
      );
    }

    // 4. Sanitize transaction descriptions to prevent injection
    const sanitizedTransactions = transactions.map((tx) => ({
      description: tx.description.substring(0, 500).trim(),
      amount: tx.amount,
    }));

    const userMessage = JSON.stringify(
      sanitizedTransactions.map((tx, i) => ({
        index: i,
        description: tx.description,
        amount: tx.amount,
      }))
    );

    // 5. Call Anthropic API
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '[]';
    const results = parseResults(text, transactions.length);

    return NextResponse.json({ results });
  } catch (err) {
    // Log error details server-side only (never expose to client)
    const errorId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error';
    logError('Categorization failed', {
      errorId,
      errorMessage,
    });

    // Return generic error to client
    return NextResponse.json(
      {
        error: 'Categorization failed. Please try again.',
        errorId, // For support reference only
      },
      { status: 500 }
    );
  }
}
