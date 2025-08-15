import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { getLogger } from '@/lib/logger';

type ReviewRequest = { pr_url?: string };

function validatePrUrl(input: string | undefined): { ok: true; url: URL } | { ok: false; error: string } {
  if (!input) return { ok: false, error: 'pr_url is required' };
  try {
    const u = new URL(input);
    if (!/^https?:$/.test(u.protocol)) return { ok: false, error: 'invalid protocol' };
    if (u.hostname !== 'github.com') return { ok: false, error: 'only github.com is supported' };
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 4) return { ok: false, error: 'invalid PR url shape' };
    const [owner, repo, pull, id] = parts;
    if (!owner || !repo || pull !== 'pull' || !/^\d+$/.test(id ?? '')) {
      return { ok: false, error: 'invalid PR url pattern' };
    }
    return { ok: true, url: u };
  } catch {
    return { ok: false, error: 'invalid URL' };
  }
}

function parseOwnerRepoNumber(u: URL): { owner: string; repo: string; number: string } {
  const parts = u.pathname.split('/').filter(Boolean);
  const [owner, repo, _pull, id] = parts;
  return { owner, repo, number: id! };
}

async function fetchPrDiff(u: URL, token: string): Promise<string> {
  const { owner, repo, number } = parseOwnerRepoNumber(u);
  const api = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`);
  const resp = await fetchWithTimeout(api.toString(), {
    headers: {
      Accept: 'application/vnd.github.v3.diff',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'practice-code-reviewer',
    },
    cache: 'no-store',
    method: 'GET',
  } as RequestInit, 15_000);
  if (!resp.ok) {
    throw new Error(`diff fetch failed: ${resp.status}`);
  }
  return await resp.text();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const traceEnabled = (String(req.headers['x-trace'] ?? '') === '1' || process.env.DEBUG_REVIEW === '1') && process.env.NODE_ENV !== 'production';
  const traceId = randomUUID();
  const t0 = Date.now();
  const log = getLogger({ traceId });
  const trace = (msg: string, data?: Record<string, unknown>) => {
    if (traceEnabled) log.info(data ?? {}, msg); else log.debug(data ?? {}, msg);
  };
  res.setHeader('X-Trace-Id', traceId);
  trace('start', { method: req.method, url: req.url });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getSession(req, res);
  const token = session.githubToken;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = (req.body ?? {}) as ReviewRequest;
  trace('validate pr_url');
  const v = validatePrUrl(body.pr_url);
  if (!v.ok) {
    trace('bad pr_url', body.pr_url);
    return res.status(400).json({ error: v.error });
  }

  try {
    trace('fetch diff:begin');
    const d0 = Date.now();
    const diff = await fetchPrDiff(v.url, token);
    trace('fetch diff:end', { ms: Date.now() - d0, len: diff.length });
    const MAX = 200_000;
    if (diff.length > MAX) {
      trace('diff too large', { len: diff.length });
      return res.status(413).json({ error: 'Diff too large' });
    }

    // テスト環境では決定的にダミー結果を返す
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      const dummy = summarizeDiff(diff);
      res.setHeader('X-Review-Via', 'dummy');
      trace('return dummy (test)');
      return res.status(200).json({ model: 'gpt-5', result: dummy, via: 'dummy' });
    }

    // 本番/ローカルでは OpenAI を呼び出す（OPENAI_API_KEY 必須）
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      // API キーが無い場合はダミー結果を返す（動作継続）
      const fallback = summarizeDiff(diff);
      res.setHeader('X-Review-Via', 'dummy');
      trace('return dummy (no api key)');
      return res.status(200).json({ model: 'gpt-5', result: fallback, via: 'dummy' });
    }

    const system =
      'あなたは熟練のコードレビュアです。変更差分（Unified Diff）を読み、改善提案を簡潔な箇条書きで出力してください。各項目は1行・命令形・具体的に。冗長な前置きは不要。最大8項目に収めてください。';
    const user = [
      '以下は Pull Request の diff です。品質・セキュリティ・可読性・性能・テスト観点から改善点を指摘し、必要ならサンプル修正も簡潔に提案してください。',
      '',
      '--- BEGIN DIFF ---',
      limitForModel(diff),
      '--- END DIFF ---',
    ].join('\n');

    // OpenAI 公式ライブラリ（Responses API）で呼び出し
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey, timeout: 45_000 });
    trace('openai:request:begin', { inputLen: user.length });
    const o0 = Date.now();
    const data = await client.responses.create({
      model: 'gpt-5',
      max_output_tokens: 500,
      // Responses API では単一文字列の input もサポート
      input: `SYSTEM:\n${system}\n\nUSER:\n${user}`,
    } as any);
    const content: string = (data as any)?.output_text ?? '';
    trace('openai:request:end', { ms: Date.now() - o0, outLen: content.length });
    const result = normalizeBullets(content);

    res.setHeader('X-Review-Via', 'openai');
    trace('done', { totalMs: Date.now() - t0 });
    return res.status(200).json({ model: 'gpt-5', result, via: 'openai' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'review error';
    const isAbort = e instanceof Error && (e.name === 'AbortError' || /aborted|timeout|The operation was aborted/i.test(e.message));
    trace('error', { message, isAbort });
    return res.status(isAbort ? 504 : 502).json({ error: message });
  }
}

function summarizeDiff(diff: string): string[] {
  const changedFiles = Array.from(diff.matchAll(/^diff --git a\/(.+?) b\/.+$/gm)).map((m) => m[1]);
  const additions = (diff.match(/^\+(?!\+\+\s)/gm) || []).length;
  const deletions = (diff.match(/^-(?!--\-\s)/gm) || []).length;
  return [
    `変更ファイル数: ${new Set(changedFiles).size}`,
    `追加行: ${additions}`,
    `削除行: ${deletions}`,
    'テスト追加/更新の必要性を確認し、主要分岐の網羅を検討',
  ];
}

function normalizeBullets(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  // 先頭記号を取り除き、空行は除外
  return lines.map((l) => l.replace(/^[-*•\d+.)\]]\s*/, ''));
}

function limitForModel(diff: string): string {
  const LIMIT = 60_000; // モデル入力の実用的な上限（応答速度改善）
  if (diff.length <= LIMIT) return diff;
  return `${diff.slice(0, LIMIT)}\n--- TRUNCATED FOR SPEED (${diff.length - LIMIT} chars omitted) ---`;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(input as any, { ...init, signal: controller.signal } as RequestInit);
    return resp;
  } finally {
    clearTimeout(id);
  }
}
