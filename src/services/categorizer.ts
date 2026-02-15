import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, type Category } from '@/types/transaction';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function categorizeTransactions(
  descriptions: string[]
): Promise<Category[]> {
  if (descriptions.length === 0) return [];

  const prompt = `Categorize each transaction description into exactly one of these categories: ${CATEGORIES.join(', ')}.

Return ONLY a JSON array of category strings, one per description, in the same order.

Descriptions:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    return descriptions.map(() => 'Other' as Category);
  }

  const parsed: string[] = JSON.parse(jsonMatch[0]);

  return parsed.map((cat) =>
    CATEGORIES.includes(cat as Category) ? (cat as Category) : 'Other'
  );
}
