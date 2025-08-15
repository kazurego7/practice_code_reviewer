import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyRaw = process.env.OPENAI_API_KEY;
  const key = keyRaw?.trim();
  const hasKey = Boolean(key);
  const len = key ? key.length : 0;
  const preview = key ? `${key.slice(0, 3)}...${key.slice(-3)}` : null;
  // 本番では使わない簡易デバッグ用
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).end('Not Found');
  }
  return res.status(200).json({
    hasKey,
    keyPreview: preview,
    keyLength: len,
    nodeEnv: process.env.NODE_ENV,
    jestWorkerIdDefined: Boolean(process.env.JEST_WORKER_ID),
  });
}
