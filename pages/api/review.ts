import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const MAX_DIFF_CHARS = 200_000;

async function fetchDiff(prUrl: string): Promise<string> {
  const diffUrl = prUrl.endsWith('.diff') ? prUrl : `${prUrl}.diff`;
  const resp = await fetch(diffUrl);
  if (!resp.ok) {
    throw new Error('Failed to fetch diff');
  }
  return resp.text();
}

async function callOpenAI(diff: string): Promise<string[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.responses.create({
    model: 'gpt-5',
    input: `Please review the following diff and provide bullet list of improvements.\n\n${diff}`,
  });
  const output = (completion as any).output_text as string | undefined;
  if (!output) return [];
  return output
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { pr_url } = req.body;
  if (typeof pr_url !== 'string') {
    return res.status(400).json({ error: 'pr_url is required' });
  }

  try {
    const diff = await fetchDiff(pr_url);
    if (diff.length > MAX_DIFF_CHARS) {
      return res.status(413).json({ error: 'Diff too large' });
    }

    let messages: string[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        messages = await callOpenAI(diff);
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    const issues = messages.map((message) => ({ message }));
    return res.status(200).json({ issues });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export { MAX_DIFF_CHARS };
