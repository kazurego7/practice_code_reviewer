"use client";

import Image from 'next/image';
import React from 'react';
import { useSearchParams } from 'next/navigation';

function isValidPrUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (!/^https?:$/.test(u.protocol)) return false;
    if (u.hostname !== 'github.com') return false;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 4) return false;
    const [owner, repo, pull, id] = parts;
    return Boolean(owner && repo && pull === 'pull' && /^\d+$/.test(id ?? ''));
  } catch {
    return false;
  }
}

type ReviewResponse = { model: string; result: string[]; via?: 'openai' | 'dummy' };

export default function ReviewPage() {
  const params = useSearchParams();
  const pr = params.get('pr') ?? '';
  const [auth, setAuth] = React.useState<null | { authenticated: boolean }>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<ReviewResponse | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' });
        const j = (await r.json()) as { authenticated: boolean };
        if (mounted) setAuth(j);
      } catch {
        if (mounted) setAuth({ authenticated: false });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!auth?.authenticated) return;
      if (!isValidPrUrl(pr)) {
        setError('PR URL が不正です');
        return;
      }
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const resp = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Trace': '1' },
          body: JSON.stringify({ pr_url: pr }),
        });
        if (!resp.ok) {
          const j = (await resp.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `HTTP ${resp.status}`);
        }
        const j = (await resp.json()) as ReviewResponse;
        if (mounted) setData(j);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'unknown error';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [auth?.authenticated, pr]);

  return (
    <div className="font-sans min-h-screen p-8 sm:p-12">
      <main className="mx-auto w-full max-w-[720px] flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Image className="dark:invert" src="/next.svg" alt="logo" width={120} height={28} />
          <h1 className="text-lg font-semibold">レビュー結果</h1>
        </header>

        {auth === null && <div className="text-sm text-gray-600 dark:text-gray-300">セッション確認中…</div>}
        {auth?.authenticated === false && (
          <div className="rounded border p-4">
            <p className="text-sm mb-2">レビューを実行するには GitHub でログインしてください。</p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="rounded bg-black text-white px-3 py-1.5 text-sm" href="/api/auth/login">
              ログイン
            </a>
          </div>
        )}

        {auth?.authenticated && (
          <section className="w-full">
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 break-all">対象PR: {pr || '-'}</div>
            {loading && <div className="text-sm">レビュー実行中…</div>}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400" role="alert">
                エラー: {error}
              </div>
            )}
            {data && (
              <ul className="list-disc pl-5 text-sm">
                {data.result.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            {data && (
              <div className="mt-3 text-xs text-gray-500">
                ソース: {data.via === 'openai' ? 'OpenAI（gpt-5）' : 'ダミー'}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
